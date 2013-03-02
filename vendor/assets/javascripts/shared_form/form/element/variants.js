var SharedForm                   = SharedForm                       || {};
SharedForm.Form                  = SharedForm.Form                  || {};
SharedForm.Form.Element          = SharedForm.Form.Element          || {};
SharedForm.Form.Element.Variants = SharedForm.Form.Element.Variants || {};

Object.extend(SharedForm.Form.Element.Variants, {
	MAP: {},

	register: function(value, object) {
		this.set(value, (this.get(value) || []).concat([object.id]));
	},

	normalizedShared: function() {
		if (Object.isArray(this.shared)) {
			return this.shared.join(this.DELIMITER);
		} else {
			return this.MAP[this.shared] || this.shared;
		}
	}
});
