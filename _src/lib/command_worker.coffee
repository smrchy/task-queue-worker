cli = require('cli').enable('help', 'status')
TQW = require( "./worker" )

exports.run = ->
	cli.parse(
		queues: [ "q", "Comma separated list of queues to monitor (e.g. -q alerts,jobs,uptimecheck).", "string" ]
		configkey: [ "c", "Name of Redis SET that contains all queues to monitor (e.g. -k tqm:QueuesToMonitor). By using the -k parameter you can make sure that multiple task-queue-workers are using the same setting.", "string" ]
		taskcount: [ "t", " The amount of concurrent tasks the task-queue-worker will handle.", "number", 5 ]
		host: [ false, "RSMQ-Redis host name", "string", "127.0.0.1" ]
		post: [ false, "RSMQ-Redis port", "number", 6379 ]
		ns: [ false, "RSMQ Namespace", "string", "taskqueueworker" ]
	)
	cli.main ( args, options )->
		
		new TQW( options )

		return
	return