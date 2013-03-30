require 'stub'

module StubHelper
	# TODO: remove the patching
	def resource_stub
		@resource_stub ||= begin
			stub = Stub::Template::Prototype.new(
				empty_resource id: '#{id}' # TODO: remove template code
			)

			if stub.respond_to? :decorator_class then
				stub.decorator_class.new stub
			else
				stub
			end
		end
	end

	# TODO: remove postprocessing
	def render_stub stub
		render(stub).tap do |html|
			html.gsub! %r'src="/[^"]+/\#{', 'src="#{' # remove relative URL prefix
		end
	end

	def empty_resource methods = {}
		resource_class.new { |record|
			class << record
				def new_record?
					false
				end
			end

			for key, value in methods do
				record.singleton_class.
					send(:define_method, key) { value }
			end
		}
	end
end
