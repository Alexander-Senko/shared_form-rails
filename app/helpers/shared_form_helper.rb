module SharedFormHelper
	include StubHelper

	delegate :locales, :multilingual?, :to => SharedForm

	def shared_form_for resources, options = {}, &block
		simple_form_for shared_form_object(resources), {
			html: shared_form_html_options_for(resources),
		}.deep_merge(options) do |form|
			render layout: '/shared_form', object: form, &block
		end
	end

	private

	def shared_form_html_options_for resources
		{
			class: 'shared',
			lang:  I18n.locale,
			name:  resource_instance_name,
			data: {
				objects: [ resources ].flatten.to_json,
				:'thumbnail-template'    => render_stub(resource_stub).to_str,
				:'resource-url-template' => polymorphic_url(resource_stub,  format: :json),
				:'collection-url'        => polymorphic_url(resource_class, format: :json),
			}
		}
	end

	def shared_form_object resources
		if resources.respond_to? :map then
			resource_class.new
		else
			resources
		end
	end
end
