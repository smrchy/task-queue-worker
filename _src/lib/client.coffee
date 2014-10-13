Redis = require "redis"

config = require "./config" 
Message = require "./message"

module.exports = class TQWClient extends require( "mpbasic" )( config )
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
			# message defaults
			messageDefaults: {}

	_validateOptions:=>
		if not @config.queue?.length
			@_handleError( false, "EMISSINGQUEUE" )
		return

	initialize: ( options )=>
		@_validateOptions()

		config.init( options )
		@connected = false

		@Message = require( "./message" )( @config.messageDefaults )

		config.queues = [ @config.queue ]

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

	_send: ( msgData, cb )=>
		msg = new @Message( msgData )
		@queue.send msg, ( err, resp )=>
			if err
				@_handleError( cb, err )
				return
			if cb?
				cb( null, resp )
				return
			@msg._dispose()
			@debug( "send done", resp )
			return
		return

	ERRORS: =>
		@extend super, 
			"EMISSINGQUEUE": [ 409, "You have to define a queue name to use"]
			"EQUEUENOTAVAIL": [ 404, "The given queue is not availible"]