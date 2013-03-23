//= require shared_form/form/element/variants

var SharedForm          = SharedForm              || {};
SharedForm.Form         = SharedForm.Form         || {};
SharedForm.Form.Element = SharedForm.Form.Element || {};

Object.extend(SharedForm.Form.Element, {
	initialize: function(objectName) {
		if (objectName)
			this.objectName = this.name
				.sub(new RegExp('^'+objectName), 'object')
				.sub('_attributes]', ']')
				.gsub('[', '["')
				.gsub(']', '"]');
		else
			this.objectName = 'object["'+this.name+'"]';
		if (this.detectLang())
			this.objectNameWithoutLocale = this.objectName.sub('_'+this.lang+'"]', '"]');

		this.variants = Object.extend($H(), SharedForm.Form.Element.Variants);
		this.variants.initial = this.value;

		return this;
	},

	register: function(object, register) {
		var value;
		try { value = value || eval(this.objectName)              } catch(e) {}
		try { value = value || eval(this.objectNameWithoutLocale) } catch(e) {}
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
				this.checked = value;
			} else
				this.value = value;
		this.variants.shared = shared;
		this.changed();
	},

	fill: function(object) {
		if (this.type == 'hidden') return;
		if (this.multiple) {
			var objectValue = [];
			this.register(object, function(value) {
				objectValue.push(value)
			});
			this.value = objectValue.join(this.variants.DELIMITER);
		} else
			this.register(object, function(value) {
				this.value = value
			}.bind(this));
		this.changed();
	},

	reset: function() {
		if (this.isModified()) {
			this.value = this.variants.normalizedShared() ||
			             this.variants.initial;
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
		if (Object.isString(this.value))
			this.value = this.value.strip();
		this[(this.isModified() ? 'add' : 'remove') + 'ClassName']('modified');
	},

	/* private */

	normalizedValue: function(unserialized) {
		if (this.multiple) {
			var value = this.value.split(/\s*[,;]\s*/).without('').sort();
			return unserialized ?
			       value :
			       value.join(this.variants.DELIMITER);
		} else if (this.type == 'checkbox') {
			if (this.checked)
				return this.value;
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
	}
});
