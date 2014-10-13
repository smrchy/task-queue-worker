DEFAULT = 
	queues: []
	client: null
	host: "127.0.0.1"
	port: 6379
	options: {}
	ns: "taskqueueworker"


# The config module
extend = require( "extend" )
pckg = require( "../package.json" )

# load the local config if the file exists
try
	_localconf = require( "../config.json" )
catch _err
	if _err?.code is "MODULE_NOT_FOUND"
		_localconf = {}
	else
		throw _err


class Config
	constructor: ( @severity = "info" )->
		return

	init: ( input )=>
		if @config?
			@config = extend( true, @config, input, { version: pckg.version } )
		else
			@config = extend( true, {}, DEFAULT, _localconf, input, { version: pckg.version } )
		@_inited = true
		return

	all: ( logging = false )=>
		if not @_inited
			@init( {} )

		_all = for _k, _v in @config
			@get( _k, logging )
		return _all

	get: ( name, logging = false )=>
		if not @_inited
			@init( {} )

		if not name? or name is "_global"
			_cnf = @config
		else
			_cnf = @config?[ name ] or null
		if logging

			logging = 
				logging:
					severity: process.env[ "severitytqw"] or process.env[ "severity_#{name}"] or @severity
					severitys: "fatal,error,warning,info,debug".split( "," )
			return extend( true, {}, logging, _cnf )
		else
			return _cnf

module.exports = new Config( process.env.severity )