//= require shared_form/form/element

var SharedForm  = SharedForm      || {};
SharedForm.Form = SharedForm.Form || {};

Object.extend(SharedForm.Form, {
	initialize: function(editor) {
		this.editor = editor;

		this.sharedControls = this.getElements().map(function(element) {
			if (element.type.match(/submit|image|reset/))
				return;

			if (!this.name || element.name.startsWith(this.name+'[')) {
				return Object.extend(
					element, SharedForm.Form.Element
				).initialize(this.name);
			}
		}, this).compact();

		if ($H(this.editor.objects).any())
			this.refresh();

		this.observe('change', this.changed.bind(this));
		this.observe('submit', this.submit.bind(this));
		this.observe('reset',  this.reset.bind(this));

		return this;
	},

	// TODO: support for non-text multiple controls
	//       * check-boxes
	//       * select-multiple
	refresh: function() {
		if (this.editor.isLoading())
			return;

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
	submit: function(event) {
		event && event.stop();

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
					this.editor.updateThumbnail(
						object.thumbnailElement, transport.responseJSON
					);

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

		return false
	},

	// TODO: confirm
	reset: function(event) {
		event && event.stop();

		this.sharedControls.invoke('reset');
		this.changed();

		return false
	},

	isModified: function() {
		return !!this.down('.modified') &&
		       $H(this.editor.objects).any() ||
		       $H(this.editor.objects).values().find(function(o) { return o.local });
	},

	changed: function(event) {
		if (event) event.element().changed();
		this.down('input[type="submit"]').disabled = !this.isModified();
	}
});
