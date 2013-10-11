# regex by Diego Perini 
# https://gist.github.com/dperini/729294
# modified to be able to use 127.x.x.x and 192.x.x.x
regExUrl = new RegExp(
	"^" +
	# protocol identifier
	"(?:(?:https?|ftp)://)" +
	# user:pass authentication
	"(?:\\S+(?::\\S*)?@)?" +
	"(?:" +
	# IP address exclusion
	# private & local networks
	"(?!10(?:\\.\\d{1,3}){3})" +
	#"(?!127(?:\\.\\d{1,3}){3})" +
	"(?!169\\.254(?:\\.\\d{1,3}){2})" +
	#"(?!192\\.168(?:\\.\\d{1,3}){2})" +
	"(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
	# IP address dotted notation octets
	# excludes loopback network 0.0.0.0
	# excludes reserved space >= 224.0.0.0
	# excludes network & broacast addresses
	# (first & last IP address of each class)
	"(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
	"(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
	"(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
	"|" +
	# host name
	"(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)" +
	# domain name
	"(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*" +
	# TLD identifier
	"(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
	")" +

	"(?::\\d{2,5})?" +
	# resource path
	"(?:/[^\\s]*)?" +
	"$", "i"
)

utils = 
	randRange: ( lowVal, highVal )->
		return Math.floor( Math.random()*(highVal-lowVal+1 ))+lowVal

	arrayRandom: ( array )->
		idx = utils.randRange( 0, array.length-1 )
		return array[ idx ]
	isUrl: (url)->
		return regExUrl.test( url )
	now: ->
		return Math.round( Date.now() / 1000 )
	probability: ( val = 50 )->
		return utils.randRange( 0,100 ) > val


module.exports = utils