(function() {
  var regExUrl, utils;

  regExUrl = new RegExp("^" + "(?:(?:https?|ftp)://)" + "(?:\\S+(?::\\S*)?@)?" + "(?:" + "(?!10(?:\\.\\d{1,3}){3})" + "(?!169\\.254(?:\\.\\d{1,3}){2})" + "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" + "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" + "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" + "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" + "|" + "(?:(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)" + "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]+-?)*[a-z\\u00a1-\\uffff0-9]+)*" + "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" + ")" + "(?::\\d{2,5})?" + "(?:/[^\\s]*)?" + "$", "i");

  utils = {
    randRange: function(lowVal, highVal) {
      return Math.floor(Math.random() * (highVal - lowVal + 1)) + lowVal;
    },
    arrayRandom: function(array) {
      var idx;
      idx = utils.randRange(0, array.length - 1);
      return array[idx];
    },
    isUrl: function(url) {
      return regExUrl.test(url);
    },
    now: function() {
      return Math.round(Date.now() / 1000);
    },
    probability: function(val) {
      if (val == null) {
        val = 50;
      }
      return utils.randRange(0, 100) > val;
    }
  };

  module.exports = utils;

}).call(this);
