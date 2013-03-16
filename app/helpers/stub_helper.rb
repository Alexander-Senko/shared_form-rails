require 'stub'

module StubHelper
	# TODO: remove the patching
	def resource_stub
		@resource_stub ||= begin
			stub = Stub::Template::Prototype.new resource_class.new { |record|
				class << record
					def new_record?
						false
					end

					def id
						'#{id}'
					end
				end
			}

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
end
