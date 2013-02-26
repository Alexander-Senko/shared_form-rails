var SharedForm = Object.extend(Class.create({ // instance methods
	loading: [], // IDs of objects being requested

	initialize: function(form, options) {
		this.form                = $(form);
		this.objects             = eval(form.getAttribute('data-objects'));
		this.collectionURL       = decodeURI(form.getAttribute('data-collectionURL') || form.action.replace(/[?&]id=\d+/, ''));
		this.resourceURLTemplate = new Template(decodeURIComponent(form.getAttribute('data-resourceURLTemplate') || (form.action.replace(/[?&]id=\d+/, '') + '?id=#{id}').replace(/[?&](.*)\?/, '?$1&')));
		this.thumbnailTemplate   = new Template(decodeURIComponent(form.getAttribute('data-thumbnailTemplate'))); // TODO: default template
		this.thumbnails          = form.adjacent('.thumbnails')[0] || $$('.thumbnails')[0];

		if (this.objects) {
			this.objects = this.objects.inject({}, function(hash, object) {
				hash[object.id] = object;
				return hash;
			});
		} else {
			// TODO: collect from the form
			this.objects = {};
		}

		this.ownsThumbnails = (this.thumbnails.select('.thumbnail').size() == $H(this.objects).size()); // TODO(?): better check

		document.body.observe('drop', function(event) {
			event.stop();
			$A(event.dataTransfer.files).each(function(file) {
				// TODO: extract meta-info
				if (file.type.startsWith('image')) {
					if (window.URL) { // i.e. Gecko 2.0
						var imageURL = URL.createObjectURL(file);
						var object = this.add({ filename: file.name,
							thumbnail: { url: imageURL },
							preview:   { url: imageURL }
						});
					} else { // i.e. Gecko 1.9.2
						object = this.add({ filename: file.name,
							thumbnail: {},
							preview:   {}
						});
						Event.observe(new FileReader(), 'load', function(event) {
							object.thumbnail.url = event.target.result;
							object.preview.url   = event.target.result;
							this.register(object);
						}.bind(this)).readAsDataURL(file);
					}
				}

				new Ajax.Request(this.objectURL(object), {
					postBody: file,
					requestHeaders: {
						'Content-Type': file.type,
						'X-File-Name':  file.name
					},
					onSuccess: function(transport) {
						if (window.URL)
							URL.revokeObjectURL(object.thumbnail.url);
						this.register(transport.responseJSON, object.id);
					}.bind(this),
					onFailure: function(transport) {
						object.thumbnailElement.fire('upload:failed', Object.extend(object, {
							file:   file,
							errors: transport.responseJSON
						}));
					}.bind(this)
				});
			}, this);
		}.bind(this)
		).observe('dragenter', Event.stop
		).observe('dragleave', Event.stop
		).observe('dragover',  Event.stop
		);

		Object.extend(this.form, SharedForm.Form).initialize(this);
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
						URL.revokeObjectURL(object.thumbnail.url);
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
}), { // class methods
	NEW_ID: 1,
	all: [],

	initialize: function(options) {
		$$(SharedForm.Form.SELECTOR).each(function(form) {
			SharedForm.all.push(
				new SharedForm(form, options)
			);
		});
	},

	Form: {
		initialize: function(editor) {
			this.editor = editor;

			this.sharedControls = this.getElements().map(function(element) {
				if (element.type.match(/submit|image|reset/)) return;
				if (!this.name || element.name.startsWith(this.name+'[')) {
					return Object.extend(element, SharedForm.Form.Element).initialize(this.name);
				}
			}, this).compact();

			if ($H(this.editor.objects).any())
				this.refresh();

			this.observe('change', this.changed.bind(this));
			this.observe('reset',  this.reset.bind(this));

			return this;
		},

		// TODO: support for non-text multiple controls
		//       * check-boxes
		//       * select-multiple
		refresh: function() {
			if (this.editor.isLoading()) return;
			this.sharedControls.invoke('refresh', $H(this.editor.objects));
			this.changed();
		},

		fill: function(object) {
			this.sharedControls.invoke('fill', object);
			this.changed();
		},

		switchLanguage: function(lang) {
			this.select('fieldset[lang ="'+lang+'"]').each(Element.show);
			this.select('fieldset[lang!="'+lang+'"]').each(Element.hide);
		},

		// TODO: use FormData if available
		submit: function(event) { event && event.stop();
			var multiple = [];
			var disabled = this.sharedControls.map(function(element) {
				if (element.isModified()) { // enabled
					if (element.multiple)
						multiple.push(element);
				} else if (Object.isElement(this[element.name])) {
					element.disable();
					return element;
				} else { // multiple elements with the same name
					return $A(this[element.name]).invoke('disable');
				}
			}, this).compact().flatten();

			$H(this.editor.objects).values().each(function(object) {
				this.editor.loading.push(object.id);

				multiple.each(function(element) {
					var objectValue = [];
					element.register(object, function(value) { objectValue.push(value) });
					element.store('value', element.value);
					element.value = objectValue.without.apply(objectValue, element.variants.shared)
					                .concat(element.normalizedValue(true))
					                .join(element.variants.DELIMITER);
				});

				// TODO: refactor
				// NOTE: see also the part below
				if (object.local)
					disabled.each(function(element) {
						element.enable();
						element.store('value', element.value);
						element.register(object, function(value) { element.value = value });
					});

				new Ajax.Request(this.editor.objectURL(object), { method: object.local ? 'post' : 'put',
					parameters: this.serialize(),
					onSuccess: function(transport) {
						this.editor.updateThumbnail(object.thumbnailElement, transport.responseJSON);
						(function() {
							if (!$H(this.editor.objects).any())
								this.reset();
						}).bind(this).defer();
					}.bind(this),
					onFailure: function(transport) {
						var errors = transport.responseJSON;
						// TODO: error handling
					}.bind(this),
					onComplete: function(transport) {
						this.loading = this.loading.without(object.id);
					}.bind(this.editor)
				});

				// TODO: refactor
				// NOTE: see above part also
				if (object.local)
					disabled.each(function(element) {
						element.disable();
						element.value = element.retrieve('value');
					});

				multiple.each(function(element) {
					element.value = element.retrieve('value');
				});
			}, this);

			disabled.invoke('enable');
		return false },

		// TODO: confirm
		reset: function(event) { event && event.stop();
			this.sharedControls.invoke('reset');
			this.changed();
		return false },

		isModified: function() {
			return !!this.down('.modified') &&
			       $H(this.editor.objects).any() ||
			       $H(this.editor.objects).values().find(function(o) { return o.local });
		},

		changed: function(event) {
			if (event) event.element().changed();
			this.down('input[type="submit"]').disabled = !this.isModified();
		},

		Element: {
			initialize: function(objectName) {
				if (objectName)
					this.objectName = this.name.sub(new RegExp('^'+objectName), 'object')
					                  .gsub('[', '["').gsub(']', '"]');
				else
					this.objectName = 'object["'+this.name+'"]';
				if (this.detectLang())
					this.objectNameWithoutLocale = this.objectName.sub('_'+this.lang+'"]', '"]');

				this.variants = Object.extend($H(), SharedForm.Form.Element.Variants);
				this.variants.initial = this.value;

				return this;
			},

			register: function(object, register) {
				var value = eval(this.objectName) ||
				            eval(this.objectNameWithoutLocale);
				if (!value) return;

				if (!Object.isFunction(register))
					register = this.variants.register.bind(this.variants);

				if (Object.isArray(value)) {
					this.multiple = true;

					value.each(function(o) {
						if (o.lang && o.lang != this.lang) return;
						switch (this.type) {
							case 'text':
							case 'textarea':
								register(o.name || o, object);
							break;
						}
					}, this);
				} else {
					register(value, object);
				}
			},

			refresh: function(objects) {
				this.variants._object = {}; // FIXME: use API

				objects.values().each(this.register, this);

				var values = this.variants.keys().select(function(value) {
					return this.get(value).size() == objects.size();
				}, this.variants);

				var value, shared;
				if (this.multiple) {
					value  = values.join(this.variants.DELIMITER);
					shared = values.sort();
				} else if (values.any()) {
					value  = values[0];
					shared = values[0];
				} else {
					value  = '';
					shared = undefined;
				}

				if (!this.isModified())
					if (this.type == 'checkbox') {
						this.indeterminate = value == '';
						this.checked       = value;
					} else
						this.value         = value;
				this.variants.shared = shared;
				this.changed();
			},

			fill: function(object) {
				if (this.type == 'hidden') return;
				if (this.multiple) {
					var objectValue = [];
					this.register(object, function(value) { objectValue.push(value) });
					this.value = objectValue.join(this.variants.DELIMITER);
				} else
					this.register(object, function(value) { this.value = value }.bind(this));
				this.changed();
			},

			reset: function() {
				if (this.isModified()) {
					this.value = this.variants.normalizedShared() || this.variants.initial;
					this.changed();
				}
			},

			isModified: function() {
				if (!this.variants) return;
				var value = this.normalizedValue();
				if (Object.isUndefined(this.variants.shared)) {
					return !!value || Object.isNumber(value); // special case for 0
				} else {
					return value != this.variants.normalizedShared();
				}
			},

			changed: function(event) {
				if (Object.isString(this.value)) this.value = this.value.strip();
				this[(this.isModified() ? 'add' : 'remove')+'ClassName']('modified');
			},

			/* private */

			normalizedValue: function(unserialized) {
				if (this.multiple) {
					var value = this.value.split(/\s*[,;]\s*/).without('').sort();
					return unserialized ? value : value.join(this.variants.DELIMITER);
				} else if (this.type == 'checkbox') {
					if (this.checked) return this.value;
				} else {
					return this.value;
				}
			},

			detectLang: function() {
				if (!this.lang) {
					var container = this.up('[lang]');
					this.lang = container ? container.lang : '';
				}

				return this.lang;
			},

			Variants: {
				DELIMITER: ', ',
				MAP: {},

				register: function(value, object) {
					this.set(value, (this.get(value) || []).concat([ object.id ]));
				},

				normalizedShared: function() {
					if (Object.isArray(this.shared)) {
						return this.shared.join(this.DELIMITER);
					} else {
						return this.MAP[this.shared] || this.shared;
					}
				}
			}
		}
	}
});

SharedForm.Form.Element.Variants.MAP[false] = 0;
SharedForm.Form.Element.Variants.MAP[true]  = 1;

SharedForm.Form.SELECTOR = 'form.multiple';

document.observe('dom:loaded', SharedForm.initialize.bind(SharedForm));
