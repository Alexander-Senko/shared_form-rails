module SharedForm
	module MultilingualHelper
		def multilingual &block
			I18n.locale = I18n.locale.tap do |locale| # save locale
				for lang in locales do
					I18n.locale = lang

					concat render(layout: 'shared_form/multilingual', &block)
				end
			end
		end
	end
end
