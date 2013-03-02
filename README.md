SharedForm
==========
_by Alexander Senko_

**SharedForm** — a JavaScript library, enabling an HTML `form` to edit multiple objects & submit to multiple URLs.

Primarily designed for images collections.


Features
--------

 * Highlights changed form fields.
 * Submits only changed fields to leave others untouched.
 * Displays field's content only if identical for all objects.
 * Customizable object HTML-templates & URLs.
 * Can add or remove objects while editing.
 * Unobtrusive — no inline JS needed.
 * Upload files via drag-and-drop.
 * …more to come.


Dependencies
------------

 * PrototypeJS 1.6


Usage
-----

### Initialize

Explicitly with JavaScript:

```javascript
	var editor = new SharedForm($('my_form'));
```

Or just add a `shared` class to your `form` element:

```html
	<form class="shared" …>
		…
	</form>
```

###### TODO: describe configuration options

### Altering collection

```javascript
	editor.add(selected_ids);

	editor.remove(some_id);

	editor.add({
		id:   'new_object',
		data: {
			thumbnail: { url: image_url },
			preview:   { url: image_url }
		}
	});
```


License
-------

SharedForm is released under the [MIT License](http://www.opensource.org/licenses/MIT).
