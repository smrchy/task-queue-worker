utils = 
	randRange: ( lowVal, highVal )->
		return Math.floor( Math.random()*(highVal-lowVal+1 ))+lowVal

	arrayRandom: ( array )->
		idx = utils.randRange( 0, array.length-1 )
		return array[ idx ]

module.exports = utils