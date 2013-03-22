require 'haml'
require 'simple_form'
require 'prototype-rails'

require 'shared_form/engine'

module SharedForm
	def self.locales
		I18n.available_locales
	end

	def self.multilingual?
		locales.many?
	end
end
