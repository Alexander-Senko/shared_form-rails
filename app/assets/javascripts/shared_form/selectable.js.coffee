Selectable = Object.extend Class.create({ # instance methods
	initialize: (element) ->
		Object.extend element, this

		element.selectable = this
		element.on 'click', element.toggle_selection

	select: ->
		this.addClassName    Selectable.CLASS

	unselect: ->
		this.removeClassName Selectable.CLASS

	toggle_selection: ->
		this.toggleClassName Selectable.CLASS

	selected: (selected) ->
		if selected?
			selected && this.select() || this.unselect()
		else
			this.hasClassName Selectable.CLASS
}), { # class methods
	CLASS:    'selected'
	SELECTOR: '.selectable'

	initialize: (scope) ->
		Selectable.scope = scope

		for element in scope.select Selectable.SELECTOR
			new Selectable element unless element.selectable?

	all: (selector = '') ->
		Selectable.scope.select selector.split(',').map (selector) ->
			selector += Selectable.SELECTOR
		.join(',')
}


document.on 'dom:loaded', ->
	Selectable.initialize document.body


window.Selectable = Selectable
