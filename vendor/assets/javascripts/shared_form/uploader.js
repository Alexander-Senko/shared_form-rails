var SharedForm      = SharedForm          || {};
SharedForm.Uploader = SharedForm.Uploader || {};

SharedForm.Uploader = Object.extend(Class.create({ // instance methods
	initialize: function(shared_form) {
		document.body.observe('drop', function (event) {
			event.stop();

			$A(event.dataTransfer.files).each(function (file) {
				// TODO: extract meta-info
				if (file.type.startsWith('image')) {
					var object = this.add({ filename: file.name, data: {
							thumbnail: {},
							preview:   {}
						},
						setImageURL: function (imageURL) {
							object.data.thumbnail.url = imageURL;
							object.data.preview.url   = imageURL;
							this.register(object);
						}.bind(this)
					});

					if (window.URL) { // i.e. Gecko 2.0
						object.setImageURL(URL.createObjectURL(file));
					} else { // i.e. Gecko 1.9.2
						Event.observe(new FileReader(), 'load',function (event) {
							object.setImageURL(event.target.result);
						}).readAsDataURL(file);
					}
				}

				var data = new FormData();
				var request = new XMLHttpRequest(); // Ajax.Request can't handle multipart/form-data
				request.open('POST', this.objectURL(object), true);
				data.append(this.form.name+'[data]', file); // TODO: make name configurable
				request.onload = function (event) {
					var responseJSON = JSON.parse(event.target.response);

					if (parseInt(request.status / 100) == 2 || request.status == 304) {
						if (window.URL)
							URL.revokeObjectURL(object.data.thumbnail.url);
						this.register(responseJSON, object.id);
					} else {
						object.thumbnailElement.fire('upload:failed', Object.extend(object, {
							file:   file,
							errors: responseJSON
						}));
					}
				}.bind(this);
				request.send(data);
			}, this);
		}.bind(shared_form)
		).observe('dragenter', Event.stop
		).observe('dragleave', Event.stop
		).observe('dragover',  Event.stop
		);
	}
}), Object.extend(SharedForm.Uploader, { // class methods
}));
