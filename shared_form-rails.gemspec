$:.push File.expand_path('../lib', __FILE__)

# Maintain your gem's version:
require 'shared_form-rails/version'

# Describe your gem and declare its dependencies:
Gem::Specification.new do |s|
	s.name        = 'shared_form-rails'
	s.version     = SharedFormRails::VERSION
	s.authors     = ['TODO: Your name']
	s.email       = ['TODO: Your email']
	s.homepage    = 'TODO'
	s.summary     = 'TODO: Summary of SharedFormRails.'
	s.description = 'TODO: Description of SharedFormRails.'

	s.files = Dir['{app,config,db,lib}/**/*'] + ['MIT-LICENSE', 'rails', 'README.rdoc']

	s.add_dependency 'rails', '~> 3.2'
	s.add_dependency 'prototype-rails'

	s.add_development_dependency 'sqlite3'
end
