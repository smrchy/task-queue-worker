request = require( "request" )

config = require "./config" 

module.exports = class TQWRequest extends require( "mpbasic" )( config )
	
	constructor: ( @msg, options )->
		super( options )
		return

	exec: ( cb )=>
		_opt = 
			url: @msg.url
			method: @msg.method
			headers: @msg.httpHeaders
			timeout: @msg.timeout * 1000

		_body = @msg.body
		if @msg.hasBody
			if @msg.hasJSONBody
				_opt.json = @msg.body
			else
				_opt.body = @msg.body

		if @msg.maxredirects > 0
			_opt.followRedirect = true
			_opt.maxRedirects = @msg.maxRedirects
		else
			_opt.followRedirect = false

		@debug "call http", _opt
		request _opt, @_handle( cb )
		return

	_handle: ( cb )=>
		return ( err, req, body )=>
			if @msg.worker?
				@msg.worker.emit "request:body", req?.body
			if err
				cb( err )
				@_dispose()
				return

			if req.statusCode >= 200 and req.statusCode < 300
				@info "http OK", req.statusCode
				cb( null )
				@_dispose()
				return
			
			@warning "Answerd with status Code: #{req.statusCode}", req?.request?.href
			_err = @_handleError( true, "ENOT2XX" )
			_err.statusCode = req.statusCode if req?.statusCode
			cb( _err )
			@_dispose()
			return

	_dispose: =>
		@msg = null
		delete @
		return

	ERRORS: =>
		@extend super, 
			"ENOT2XX": [ 500, "The http response is not type of 200" ]
