RedisMQ = require("rsmq")
async = require("async")

config = require "../config"

module.exports = ->
	
	class TQWRSMQ extends require( "mpbasic" )( config )
		
		defaults: =>
			return @extend true, super,
				name: null

		constructor: ( @rsmq, options )->
			super( options )
			return

		initialize: =>
			@emptycount = 0
			@getter( "name", =>@config.name )

		send: ( msg, delay, cb )=>
			_data = { qname: @config.name, message: msg.toString(), delay: ( if delay? then delay else msg.getDelay() ) }
			@debug "send", _data
			@rsmq.sendMessage _data, ( err, resp )=>
				if err
					@error "send pending queue message", err
					cb( err ) if cb?
					return
				@emit "new", resp
				@debug "message send", resp
				cb( null, resp ) if cb?
				return
			return

		receive: ( caller )=>
			@debug "start receive"
			#@emptycount++
			process.nextTick =>
				@rsmq.receiveMessage qname: @config.name, ( err, msg )=>
					@debug "received", msg
					if err
						@emit( "next" )
						caller.emit( "next" )
						@error "receive queue message", err
						return
					if msg?.id
						@emptycount = 0
						_id = msg.id
						_fnNext = ( err )=>
							@debug "after next", err
							@del( _id ) if not err?
							@emit( "next" )
							caller.emit( "next" )
							return

						_fnFail = ( err, msg )=>
							@warning "messaged failed", err
							@del( _id )
							@emit( "failed", msg )
							caller.emit( "failed", msg )
							@emit( "next" )
							caller.emit( "next" )
							return

						_meta =
							receiveCount: msg.rc
							firstReceive: msg.fr
							created: msg.sent

						@debug "message", msg.message, _meta
						@emit "message", msg.message, _meta, _fnNext, _fnFail
						caller.emit "message", msg.message, _meta, _fnNext, _fnFail
						#@receive( true ) if _useIntervall
					else
						@emptycount++
						@emit( "empty" )
						caller.emit( "empty" )
					return
				return
			return

		del: ( id )=>
			@rsmq.deleteMessage qname: @config.name, id: id, ( err, resp )=>
				if err
					@error "delete queue message", err
					return
				@debug "delete queue message", resp
				return
			return


	class TQWRSMQAdapter extends require( "mpbasic" )( config )
		_config_name: "_global"
		defaults: =>
			return @extend true, super,
				queues: []
				client: null
				host: "127.0.0.1"
				port: 6379
				options: {}
				ns: "taskqueueworker"

		initialize: =>
			@debug "config", @config
			@rsmq = new RedisMQ( @config )
			@queues = {}

			if @rsmq.connected
				@initQueue()
			else
				@rsmq.once "connect", @initQueues
			return

		prepareQueue: ( name )=>
			_q = new TQWRSMQ( @rsmq, name: name )
			_q.on "new", ( resp )=>@emit( "new", name, resp )
			_q.on "message", ( message, meta, next, fail )=>
				#@error "emit message", name, message
				@emit( "message", name, message, meta, next, fail )
			_q.on "next", =>@emit( "next", name )
			_q.on "empty", =>@emit( "empty", name )
			_q.on "failed", ( msg )=>@emit( "failed", name, msg )
			@queues[ name ] = _q
			return _q

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
					_q = @prepareQueue( queue )
					@emit "queue:ready", _q
					process.nextTick =>
						cb( null, _q )
						return
					return
				
				if err
					cb( err )
					return

				if resp is 1
					@debug "queue created", queue
				else
					@debug "queue allready existed", queue

				_q = @prepareQueue( queue )
				@emit "queue:ready", _q
				process.nextTick =>
					cb( null, _q )
					return
				return

			return

		grabQueue: ( name, cb )=>
			_q = @getQueue( name )
			if _q?
				cb( null, _q )
			else
				@initQueue( name, cb )
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


	return new TQWRSMQAdapter( config )
