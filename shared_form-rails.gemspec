$:.push File.expand_path('../lib', __FILE__)

# Maintain your gem's version:
require 'shared_form/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
	s.name        = 'shared_form-rails'
	s.version     = SharedForm::VERSION
	s.authors     = [ 'Alexander Senko' ]
	s.email       = [ 'Alexander.Senko@gmail.com' ]
#	s.homepage    = 'TODO'
	s.summary     = 'SharedForm for Rails.'
#	s.description = 'TODO: Description of SharedFormRails.'

	s.files = Dir['{app,config,db,lib}/**/*'] + ['MIT-LICENSE', 'Rakefile', 'README.rdoc' ]

	s.add_dependency 'rails', '>= 3.2'
	s.add_dependency 'prototype-rails'
	s.add_dependency 'stub'
	s.add_dependency 'haml'
	s.add_dependency 'simple_form'

	s.add_development_dependency 'sqlite3'
end
