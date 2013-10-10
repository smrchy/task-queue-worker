(function() {
  var utils;

  utils = {
    randRange: function(lowVal, highVal) {
      return Math.floor(Math.random() * (highVal - lowVal + 1)) + lowVal;
    },
    arrayRandom: function(array) {
      var idx;
      idx = utils.randRange(0, array.length - 1);
      return array[idx];
    }
  };

  module.exports = utils;

}).call(this);
