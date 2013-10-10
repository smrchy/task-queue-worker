utils = require( "./utils" )
async = require( "async" )
_ = require( "lodash" )._
Message = require "./message"

module.exports = class Queueing extends require( "./basic" )

	defaults: =>
		return @extend true, super,
			intervall: [ 0, 1, 5, 10 ]

	constructor: ( @qeueModule, options )->
		super( options )
		return

	initialize: =>
		@waitCount = 0
		@qeueModule.on "next", @next
		@qeueModule.on "empty", @empty
		@qeueModule.on "message", @message
		process.nextTick =>
			@intervall()
		return

	selectNextQueue: ( cb )=>
		_list = @qeueModule.listQueues()
		if _list.length > 1
			cb( null, utils.arrayRandom( _list ) )
		else
			cb( null, _list[ 0 ] )
		return

	intervall: =>
		@selectNextQueue ( err, queue )=>
			if err
				@error( "intervall select", err )
				@intervall()
				return

			@debug "recieve", queue.name
			queue.receive()
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

	message: ( queuename, msg, meta, next )=>
		_msg = new Message( msg, meta )
		_msg.process( next )
		return
		

	ERRORS: =>
		@extend super, 
			"ENOQUEUES": "No queue in list"

