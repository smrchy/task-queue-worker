utils = require( "./utils" )
async = require( "async" )
_ = require( "lodash" )._

config = require "./config" 

module.exports = class TQWQueueing extends require( "mpbasic" )( config )

	defaults: =>
		return @extend true, super,
			intervall: [ 0,1,2,3,5 ]
			probability: 85

	constructor: ( @worker, @Qidx, @queueModule, options )->
		super( options )
		return

	initialize: =>

		@Message = require( "./message" )( @config.messageDefaults )

		@waitCount = 0
		@on "next", @next
		@on "empty", @empty
		@on "message", @message
		@on "failed", @failed
		process.nextTick =>
			@intervall()
		return

	selectNextQueue: ( cb )=>
		_queues = @queueModule.listQueues()
		@debug "queue list", _queues
		if _queues.length is 1
			cb( null, _queues[ 0 ] )
			return

		# in 85% of the cases find the most active queue.
		if utils.probability( @config.probability )
			#@debug "emptycounts", @Qidx, _.zip( _.pluck( _queues, "name" ), _.pluck( _queues, "emptycount" ) )
			_list = []
			_min = Infinity
			# Collect the queues with the minimum emptycount to primary use the queues with data
			for _q in _queues
				if _q.emptycount < _min
					_min = _q.emptycount
					_list = []
					_list.push( _q )
				else if _q.emptycount is _min
					_list.push( _q )
		else
			_list = _queues

		@debug "queues with lowest emptycount", _.pluck( _list, "name" )
		if _list.length > 1
			cb( null, utils.arrayRandom( _list ) )
		else
			cb( null, _list[ 0 ] )
		return

	intervall: =>
		process.nextTick =>
			@selectNextQueue ( err, queue )=>
				if err
					@error( "intervall select", err )
					@intervall()
					return

				@info "recieve", @Qidx, queue.name, queue.emptycount
				queue.receive( @ )
				return
			return
		return

	next: =>
		@debug "next", @waitCount
		@waitCount = 0
		@intervall()
		return

	empty: =>
		@debug "empty"
		clearTimeout( @timeout ) if @timeout?
		if _.isArray( @config.intervall )
			_timeout = if @config.intervall[ @waitCount ]? then @config.intervall[ @waitCount ] else _.last( @config.intervall )
		else
			_timeout = @config.intervall
		@debug "wait", @waitCount, _timeout
		@timeout = _.delay( @intervall, _timeout * 1000 )
		@waitCount++
		return

	message: ( msg, meta, next, fail )=>
		#@error "message receiverd", msg
		try
			_msg = new @Message( msg, meta, @worker )
			_msg.process( next, fail )
		catch _err
			@error _err
			@debug "error-stack", _err.stack()
			next( _err )
		return
	
	failed: ( msg )=>
		@info "process failed", msg.url, msg.failqueue
		if msg.failqueue?
			@queueModule.grabQueue msg.failqueue, ( err, fQueue )=>
				if err?
					@error "grab failqueue", err
					return
				fQueue.send msg, 0, ( err, resp )=>
					if err?
						@error "write message to failqueue", err
						return
					@debug "write message to failqueue", resp
					return
				return
		return

	ERRORS: =>
		@extend super, 
			"ENOQUEUES": "No queue in list"

