request = require( "request" )

module.exports = class Request extends require( "./basic" )
	
	constructor: ( @msg, options )->
		super( options )
		return

	exec: ( cb )=>
		_opt = 
			url: @msg.url
			method: @msg.method
			headers: @msg.httpHeaders
			timeout: @msg.timeout

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

		@info "call http", _opt
		request _opt, @_handle( cb )
		return

	_handle: ( cb )=>
		return ( err, req )=>
			if @msg.worker?
				@msg.worker.emit "request:body", req?.body
			if err
				cb( err )
				return

			if req.statusCode >= 200 and req.statusCode < 300
				@info "http OK", req.statusCode
				cb( null )
				return
			
			@warning "Answerd with status Code: #{req.statusCode}", req?.request?.href
			@_handleError( cb, "ENOT2XX" )
			return

	ERRORS: =>
		@extend super, 
			"ENOT2XX"; "The http response is not type of 200"
