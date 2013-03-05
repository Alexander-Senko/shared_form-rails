# All this logic will automatically be available in application.js.

## Helper functions

setLanguage = ->
	hash = location.hash.slice 1

	for form in (list.up 'form' for list in $$ 'form a[lang]').uniq true
		form.switchLanguage $$('form a[lang]').pluck('lang').intersect([hash])[0]


## Initialize page elements

# Initialize language switcher for multilingual forms
document.on           'dom:loaded', setLanguage
Event.observe window, 'hashchange', setLanguage
