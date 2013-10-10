Redis = require "redis"
Queueing = require "./queueing"

module.exports = class Worker extends require( "./basic" )

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

	_validateOptions:( options )=>
		if not options.queues?.length and not options.configkey?.length
			@_handleError( "config-validation", "EMISSINGQUEUES" )
			return false
		return true

	initialize: =>

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
		@config.queues = @config.queues.split( "," )
		@queueModule = require( "./queueadapters/#{ @config.queuetype }" )( @config )
		@queueModule.on "ready", @onReady
		return

	onReady: =>
		for i in [1..@config.taskcount]
			@debug "init a new queuing", i
			new Queueing( @queueModule, queues: @config.queues )
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
			"EMISSINGQUEUES": "You have to define the list of queues to monitor or set a `configkey`."
			"EEMPTYCONFIGKEY": "The given config key does not contain queuenames"