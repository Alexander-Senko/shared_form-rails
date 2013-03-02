//= require shared_form/form
//= require shared_form/uploader
//= require shared_form/config
// TODO: extract thumbnails-related logic

var SharedForm = SharedForm || {};

SharedForm = Object.extend(Class.create({ // instance methods
	loading: [], // IDs of objects being requested

	defaults: $H({
		objects: function() {
			return []; // TODO: collect from the form
		},

		collectionURL: function() {
			return this.form.action
				.replace(/[?&]id=\d+/, '')
				.replace(/\/?\d+$/,    '');
		},

		resourceURLTemplate: function() {
			return (this.collectionURL+'?id=#{id}')
				.replace(/[?&](.*)\?/, '?$1&');
		},

		thumbnailTemplate: function() {
			// TODO: default template
		}
	}),

	initialize: function(form, options) {
		this.form = $(form);

		this.setOptions(options);

		this.collectionURL       = decodeURI(this.collectionURL);
		this.resourceURLTemplate = new Template(decodeURIComponent(this.resourceURLTemplate));
		this.thumbnailTemplate   = new Template(decodeURIComponent(this.thumbnailTemplate));
		this.thumbnails          = form.adjacent('.thumbnails')[0] || $$('.thumbnails')[0];

		this.objects = JSON.parse(this.objects).inject({}, function(hash, object) {
			hash[object.id] = object;
			return hash;
		});

		this.ownsThumbnails = (this.thumbnails.select('.thumbnail').size() == $H(this.objects).size()); // TODO(?): better check

		this.uploader = new SharedForm.Uploader(this);

		Object.extend(this.form, SharedForm.Form).initialize(this);
	},

	setOptions: function(options) {
		this.defaults.each(function(property) {
			this[property.key] = options[property.key] ||
			                     this.form.dataset[property.key.gsub('URL', 'Url')] ||
			                     property.value.bind(this)();
		}.bind(this));
	},

	add: function(objectOrID) {
		if (objectOrID.each) { // Multiple objects
			return objectOrID.each(this.add, this);
		} else if (Object.isNumber(objectOrID) ||
		           Object.isString(objectOrID)) { // TODO: filter new objects out
			var id = objectOrID;
			if (this.objects[id]) return;
			this.loading.push(id);
			new Ajax.Request(this.objectURL(id), { method: 'get',
				onSuccess: function(transport) {
					this.register(transport.responseJSON);
				}.bind(this),
				onComplete: function(transport) {
					this.loading = this.loading.without(id);
					if (transport.request.success())
						this.form.refresh();
				}.bind(this)
			});
		} else {
			var object = objectOrID;
			if (this.objects[object.id]) return;
			object.local = true;
			if (!object.id)
				object.id = [ SharedForm.NEW_ID++, object.filename || 'X' ].join('-').sub(/\..*$/, '');
			this.loading.push(object.id);
			(function() {
				this.register(object);
				this.loading = this.loading.without(object.id);
				this.form.refresh();
			}).bind(this).defer();
			return object;
		}
	},

	remove: function(objectOrID) {
		if (Object.isArray(objectOrID)) {
			return id.each(this.remove, this);
		} else {
			var object = this.objects[objectOrID.id || objectOrID];
			if (!object) return;
			this.loading.push(object.id);
			(function() {
				if (this.ownsThumbnails || object.local) { // TODO: confirm
					this.removeThumbnail(object);
					if (window.URL)
						URL.revokeObjectURL(object.data.thumbnail.url);
				}
				delete this.objects[object.id];
				this.loading = this.loading.without(object.id);
				this.form.refresh();
			}).bind(this).defer();
			return object;
		}
	},

	register: function(object, id) {
		this.assignThumbnail(object, id && this.objects[id]);
		this.objects[id || object.id] = object;
	},

	assignThumbnail: function(object, target) {
		var thumbnailElement;
		if (thumbnailElement = (target || object).thumbnailElement) // inner
			this.updateThumbnail(thumbnailElement, object);
		else if (this.ownsThumbnails && (thumbnailElement = this.thumbnailElement(object))) // outer
			this.attachThumbnail(thumbnailElement);
		else if (object.local) // new
			this.createThumbnail(object);
		object.thumbnailElement = this.thumbnailElement(object);
		object.thumbnailElement.addClassName('selected');
	},

	removeThumbnail: function(object) {
		if (object.thumbnailElement.origin) // outer
			this.detachThumbnail(object);
		else // inner
			object.thumbnailElement.remove();
	},

	createThumbnail: function(object) {
		this.thumbnails.insert(this.thumbnailHTML(object));
	},

	// TODO: refactor
	updateThumbnail: function(thumbnailElement, object) {
		thumbnailElement.update(this.thumbnailHTML(object));
		var newElement = thumbnailElement.down();
		$A(newElement.attributes).each(function(attribute) {
			thumbnailElement.setAttribute(attribute.name, attribute.value);
		});
		thumbnailElement.update(newElement.innerHTML);
	},

	attachThumbnail: function(thumbnailElement) {
		thumbnailElement.origin = thumbnailElement.parentNode;
		this.thumbnails.insert(thumbnailElement);
	},

	detachThumbnail: function(object) {
		object.thumbnailElement.origin.insert(object.thumbnailElement);
		object.thumbnailElement = undefined;
	},

	objectURL: function(objectOrID) {
		var object;
		if (Object.isNumber(objectOrID) ||
		    Object.isString(objectOrID))
			object = { id: objectOrID };
		else
			object = objectOrID;

		return object.local ?
			this.collectionURL :
			this.resourceURLTemplate.evaluate(object);
	},

	thumbnailElement: function(object) {
		return Try.these(
			function() { return Thumbnail[object.id].element }
		) || $('thumbnail_'+object.id);
	},

	thumbnailHTML: function(object) {
		return this.thumbnailTemplate.evaluate(object);
	},

	isLoading: function() {
		return this.loading.any();
	}
}), Object.extend(SharedForm, { // class methods
	NEW_ID: 1,
	all: [],

	initialize: function(options) {
		$$(SharedForm.Form.SELECTOR).each(function(form) {
			SharedForm.all.push(
				new SharedForm(form, options)
			);
		});
	}
}));


document.observe('dom:loaded', SharedForm.initialize.bind(SharedForm));
