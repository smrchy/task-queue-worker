cli = require('cli').enable('help', 'status', "version")
TQW = require( "../../index" )

_ = require( "lodash" )._

cli.setApp( "Task Queue - Client", TQW.version )

exports.run = ->
	cli.parse(
		queue: [ "q", "Name of the queue to send", "string" ]
		url: [ "u", "url to call", "string" ]
		method: [ "m", "the http method to use.", [ "GET", "POST", "PUT", "DELETE" ], "GET" ]
		body: [ "b", "a json body to send", "string", "" ]
		retrydelay: [ "r", "List of increasing delays in seconds to retry on an error", "string", "120,240,3600" ]
		maxts: [ "m", "A unix timestamp in seconds after which the message should not be processed anymore and will be deleted and handled as an error. A value of -1 disabled the maxts check.", "number", -1 ]
		failqueue: [ "f", "The name of the queue where the message is moved after it did not process successfully", "string" ]
	)
	cli.main ( args, options )->
		
		client = new TQW.Client( queue: options.queue )
		_data =
			url: options.url
			method: options.method
			body: options.body
			maxts: options.maxts
			failqueue: options.failqueue

		if _.isNumber( options.retrydelay )
			_data.retrydelay = options.retrydelay 
		else
			_retrydelays = []
			for i in options.retrydelay.split( "," )
				_retrydelays.push parseInt( i, 10 )
			if not _retrydelays.length
				_retrydelays = null
			else if _retrydelays.length is 1
				_retrydelays = _retrydelays[ 0 ]

			_data.retrydelay = _retrydelays if _retrydelays?
		
		console.log _data

		try
			client.send _data, ( err, resp )=>
				if err
					cli.error( e )
				else
					cli.ok( resp )
				process.exit()
				return
		catch _err
			cli.error( _err )
		return
	return

process.on "uncaughtException", ( _err )=>
	cli.error( _err )
	process.exit()
	return