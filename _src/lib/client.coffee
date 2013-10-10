Redis = require "redis"
Message = require "./message"

module.exports = class Worker extends require( "./basic" )
	defaults: =>
		return @extend true, super,
			queue: ""
			queuetype: "rsmq"
			#redis options
			client: null
			host: "127.0.0.1"
			port: 6379
			options: {}
			# rsmq options
			ns: "taskqueueworker"

	_validateOptions:( options )=>
		if not options.queue?.length
			@_handleError( null, "EMISSINGQUEUE" )
			return false
		return true

	initialize: =>
		@connected = false

		@config.queues = [ @config.queue ]
		@queueModule = require( "./queueadapters/#{ @config.queuetype }" )( @config )
		@queueModule.on "ready", @onReady
		return

	onReady: =>
		@queue = @queueModule.getQueue( @config.queue )
		if not @queue?
			@_handleError( null, "EQUEUENOTAVAIL" )
			return

		@connected = true
		@emit( "connected" )
		return

	send: ( msg, cb )=>
		if @connected
			@_send( msg, cb )
		else
			@once "connected", =>
				@_send( msg, cb )
				return
		return

	_send: ( msg, cb )=>
		_msg = new Message( msg )
		@queue.send _msg, ( err, resp )=>
			if err
				@_handleError( cb, err )
				return
			if cb?
				cb( null, resp )
				return
			
			@debug( "send done", resp )
			return
		return

	ERRORS: =>
		@extend super, 
			"EMISSINGQUEUE": "You have to define a queue name to use"
			"EQUEUENOTAVAIL": "The gien queue is not availible"