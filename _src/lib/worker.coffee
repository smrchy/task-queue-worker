Redis = require "redis"
Queueing = require "./queueing"

config = require "./config" 

module.exports = class TQWWorker extends require( "mpbasic" )( config )

	defaults: =>
		return @extend true, super,
			queues: ""
			configkey: null
			taskcount: 1
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

	_validateOptions: =>
		if not @config.queues?.length and not @config.configkey?.length
			@_handleError( false, "EMISSINGQUEUES" )
		return

	initialize: ( options )=>
		@_validateOptions()
		config.init( options )

		if @config.client?.constructor?.name is "RedisClient"
			@redis = @config.client
		else
			@config.client = @redis = Redis.createClient( @config.port, @config.host, @config.options )

		if @config.configkey?.length
			@loadQueueNamesFormConfigKey @config.configkey, ( err )=>
				if err 
					@_handleError( "config-validation", err )
					return
				@initQueues()
				return
		else

			@initQueues()
		return

	initQueues: =>
		if not @config.queues and @config.queues.split( "," )?.length <= 0
			@_handleError( "config-validation", err )
			return

		config.queues = @config.queues = @config.queues.split( "," )
		#@debug "initQueues", @config
		@queueModule = require( "./queueadapters/#{ @config.queuetype }" )()
		@queueModule.on "ready", @onReady
		return

	onReady: =>
		for i in [1..@config.taskcount]
			@debug "init a new queuing", i
			new Queueing( @, i, @queueModule, { queues: @config.queues, messageDefaults: @config.messageDefaults } )
		return

	loadQueueNamesFormConfigKey: ( configkey, cb )=>
		@redis.get configkey, ( err, queues )=>
			if err
				@_handleError( cb, err )
				return
			if not queues?.length
				@_handleError( cb, "EEMPTYCONFIGKEY" )
				return

			@config.queues = queues
			cb( null, @config.queues )	
			return
		return


	ERRORS: =>
		@extend super, 
			"EMISSINGQUEUES": [ 409, "You have to define the list of queues to monitor or set a `configkey`." ]
			"EEMPTYCONFIGKEY": [ 409, "The given config key does not contain queuenames" ]