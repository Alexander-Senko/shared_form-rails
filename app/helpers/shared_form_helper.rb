module SharedFormHelper
	include StubHelper

	def shared_form_for record, options={}, &block
		simple_form_for record, {
			html: shared_form_html_options_for(record),
		}.deep_merge(options) do |form|
			render layout: '/shared_form', object: form, &block
		end
	end

	private

	def shared_form_html_options_for resource
		{
			class: 'shared',
			lang:  I18n.locale,
			name:  resource_instance_name,
			data: {
				objects: [ resource.persisted? && resource ].compact.to_json,
				:'thumbnail-template'    => render_stub(resource_stub).to_str,
				:'resource-url-template' => polymorphic_url(resource_stub,  format: :json),
				:'collection-url'        => polymorphic_url(resource_class, format: :json),
			}
		}
	end
end
