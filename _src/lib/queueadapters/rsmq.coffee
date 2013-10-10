RedisMQ = require("rsmq")
async = require("async")

module.exports = ( config )->

	class RSMQQueue extends require( "../basic" )
		defaults: =>
			return @extend true, super,
				name: null

		constructor: ( @rsmq, options )->
			super( options )
			return

		initialize: =>
			@getter( "name", =>@config.name )

		send: ( msg, cb )=>
			_data = { qname: @config.name, message: msg.toString(), delay: msg.getDelay() }
			@debug "send", _data
			@rsmq.sendMessage _data, ( err, resp )=>
				if err
					@error "send pending queue message", err
					cb( err ) if cb?
					return
				@emit "new", resp
				cb( null, resp ) if cb?
				return
			return

		receive: =>
			@debug "start receive"
			@rsmq.receiveMessage qname: @config.name, ( err, msg )=>
				@debug "received", msg
				if err
					@emit( "next" )
					@error "receive queue message", err
					return
				if msg?.id
					_id = msg.id
					_fnNext = ( err )=>
						@del( _id ) if err
						@emit( "next" )
						return

					_meta =
						receiveCount: msg.rc
						firstReceive: msg.fr
						created: msg.sent

					@emit "message", msg.message, _meta, _fnNext
					#@receive( true ) if _useIntervall
				else
					@emit( "empty" )
				return
			return

		del: ( id )=>
			@rsmq.deleteMessage qname: @config.name, id: id, ( err, resp )=>
			if err
				@error "delete queue message", err
				return
			@debug "delete queue message", resp
			return


	class RSMQAdapter extends require( "../basic" )

		defaults: =>
			return @extend true, super,
				queues: []
				client: null
				host: "127.0.0.1"
				port: 6379
				options: {}
				ns: "taskqueueworker"

		initialize: =>
			@rsmq = new RedisMQ( @config )
			@queues = {}
			@on "queue:ready", ( name )=>
				_q = new RSMQQueue( @rsmq, name: name )
				_q.on "new", ( resp )=>@emit( "new", name, resp )
				_q.on "message", ( message, meta, next )=>@emit( "message", name, message, meta, next )
				_q.on "next", =>@emit( "next", name )
				_q.on "empty", =>@emit( "empty", name )
				@queues[ name ] = _q
				return

			if @rsmq.connected
				@initQueue()
			else
				@rsmq.once "connect", @initQueues
			return

		initQueues: =>
			@debug "init rsmq queues", @config.queues
			async.each @config.queues, @initQueue, ( err )=>
				if err
					@_handeError( "queue-init", err )
					return
				@debug "init rsmq queues done"
				@emit "ready"
				return
			return

		initQueue: ( queue, cb )=>
			@rsmq.createQueue qname: queue, ( err, resp )=>
				if err?.name is "queueExists"
					@debug "queue allready existed"
					@emit "queue:ready", queue
					cb( null )
					return
				
				if err
					cb( err )
					return

				if resp is 1
					@debug "queue created"
				else
					@debug "queue allready existed"
				@emit "queue:ready", queue
				cb( null )
				return

			return

		getQueue: ( name )=>
			if @queues[ name ]?
				return @queues[ name ]
			else
				return null
			return

		listQueues: =>
			ret = []
			for _n, queue of @queues
				ret.push( queue )
			return ret


	return new RSMQAdapter( config )
