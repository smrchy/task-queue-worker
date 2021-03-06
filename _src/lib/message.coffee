methods = [ "GET", "PUT", "POST", "DELETE" ]
urlParser = require( "url" )
_ = require( "lodash" )._

config = require "./config" 
utils = require( "./utils" )
Request = require( "./request" )

module.exports = ( options )->
	return class TMQMessage extends require( "mpbasic" )( config )
		_singleton: false
		defaults: =>
			return @extend true, super,
				method: "GET"
				body: null
				delay: 0
				retrylimit: 3
				retrydelay: 120
				maxts: -1
				timeout: 10
				failqueue: null
				maxredirects: 10

		constructor: ( data, @meta, @worker )->
			super( options )
			@debug "config", @config
			@defineProperties()

			# convert to object ig it's a json
			if _.isString( data )
				try data = JSON.parse( data )

			@debug "info", data, meta
			if not data.url?
				@_handleError( null, "EMISSINGURL" )
				return

			# populate object
			for _k, _v of data
				@[ _k ] = _v

			return

		toJSON: =>
			return _.pick( @, [ "url","method","body","retrylimit","retrydelay","delay","maxts","timeout","failqueue","maxredirects" ] )

		toString: =>
			return JSON.stringify( @toJSON() )

		getRetryDelay: ( retries )=>
			if _.isArray( @retrydelay )
				if @retrydelay[ retries ]?
					return @retrydelay[ retries ]
				else
					return _.last( @retrydelay )
			return @retrydelay

		getDelay: =>
			if ( @meta?.receiveCount or 0 ) < 1
				return @delay
			else
				_retry = @getRetryDelay( @meta.receiveCount )
				if @delay > _retry
					return @delay
				else
					return _retry

		process: ( next, fail )=>
			if @meta.receiveCount > @retrylimit
				fail( @_handleError( true, "EREACHEDRETRYLIMIT" ), @ )
				@_dispose()
				return

			if @maxts >= 0 and utils.now() > @maxts
				fail( @_handleError( true, "EEXPIRED" ), @ )
				@_dispose()
				return
			
			@debug "process message", @toJSON()
			new Request( @ ).exec =>
				next.apply( arguments )
				@_dispose()
				return
			return

		defineProperties: =>
			@data = 
				headers: {}
			@define( "url", ( =>@data.url ), ( ( url )=>
				if not _.isString( url ) or not utils.isUrl( url )
					@_handleError( null, "EINVALIDURL" )
					return
				@data.url = url
				return
			) )

			@define( "method", ( =>
				if @body?
					return "POST"
				else
					return @data.method or @config.method
			), ( ( method )=>
				if method not in methods
					@warning "invalid `method` so use default `#{@config.method}`. Only method of `#{methods.join( ", " )}` are allowed"
					return
				@data.method = method
				return
			) )

			@data.hasJSONBody = false
			@data.headers[ "Content-Type" ] = "appliction/x-www-form-urlencoded"
			@define( "body", ( =>@data.body), ( ( body )=>
				if _.isObject( body )
					@data.body = body
					@data.headers[ "Content-Type" ] = "application/json"
					@data.hasJSONBody = true
					return
				try
					@data.body = JSON.parse( body )
					@data.headers[ "Content-Type" ] = "application/json"
					@data.hasJSONBody = true
				catch
					@data.body = body
				return
			) )

			@getter( "httpHeaders", =>@data.headers )
			@getter( "hasBody", =>@data.body? )
			@getter( "hasJSONBody", =>@data.hasJSONBody )
			
			[ "retrylimit","retrydelay","maxts","timeout","failqueue","maxredirects", "delay" ].forEach ( _k )=>
				@define( _k, ( =>return @data[ _k ] or @config[ _k ]), ( ( _v )=>
					switch _k

						# for number based options
						when "retrylimit", "retrydelay", "maxts", "timeout", "maxredirects", "delay"
							if not _.isNumber( _v )
								@warning "invalid `#{_k}` so use default `#{@config[ _k ]}`"
								return

						# for string based options
						when "failqueue"
							if _v? and not _.isString( _v )
								@warning "invalid `#{_k}` so use default `#{@config[ _k ]}`"
								return

						# for number or array based options
						when "retrydelay"
							if not _.isNumber( _v ) and not ( _.isArray( _v ) and _v.length )
								@warning "invalid `#{_k}` so use default `#{@config[ _k ]}`"
								return
					@debug "set msg props", _k, _v
					@data[ _k ] = _v
					return
				) )
			return

		_dispose: =>
			@meta = null
			@worker = null
			@config = null
			@removeAllListeners()
			delete @
			return

		ERRORS: =>
			@extend super, 
				"EMISSINGURL": [ 409, "You have to define at least a url."]
				"EINVALIDURL": [ 409, "The url has to be a string and a valid url with leading protokoll. E.g.( http://www.google.com )"]
				"EINVALIDMETHOD": [ 409, "Only method of `#{methods.join( ", " )}` are allowed"]
				"EREACHEDRETRYLIMIT": [ 500, "This message reached it's retry limit. So delete it."]
				"EEXPIRED": [ 500, "This message reached it's `maxts` limit. So delete it."]

