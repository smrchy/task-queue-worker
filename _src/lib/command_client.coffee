cli = require('cli').enable('help', 'status')
TQC = require( "./client" )

exports.run = ->
	cli.parse(
		queue: [ "q", "Name of the queue to send", "string" ]
		url: [ "u", "url to call", "string" ]
		method: [ "m", "the http method to use.", [ "GET", "POST", "PUT", "DELETE" ], "GET" ]
		body: [ "b", "a json body to send", "string", "" ]
	)
	cli.main ( args, options )->
		
		client = new TQC( queue: options.queue )

		_data =
			url: options.url
			method: options.method
			body: options.body

		client.send _data, ( err, resp )=>
			if err
				cli.error( e )
			else
				cli.ok( resp )
			process.exit()
			return
		return
	return