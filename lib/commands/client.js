(function() {
  var TQW, cli, _,
    _this = this;

  cli = require('cli').enable('help', 'status', "version");

  TQW = require("../../index");

  _ = require("lodash")._;

  cli.setApp("Task Queue - Client", TQW.version);

  exports.run = function() {
    cli.parse({
      queue: ["q", "Name of the queue to send", "string"],
      url: ["u", "url to call", "string"],
      method: ["m", "the http method to use.", ["GET", "POST", "PUT", "DELETE"], "GET"],
      body: ["b", "a json body to send", "string", ""],
      retrydelay: ["r", "List of increasing delays in seconds to retry on an error", "string", "120,240,3600"],
      maxts: ["m", "A unix timestamp in seconds after which the message should not be processed anymore and will be deleted and handled as an error. A value of -1 disabled the maxts check.", "number", -1],
      failqueue: ["f", "The name of the queue where the message is moved after it did not process successfully", "string"]
    });
    cli.main(function(args, options) {
      var client, i, _data, _err, _i, _len, _ref, _retrydelays,
        _this = this;
      client = new TQW.Client({
        queue: options.queue
      });
      _data = {
        url: options.url,
        method: options.method,
        body: options.body,
        maxts: options.maxts,
        failqueue: options.failqueue
      };
      if (_.isNumber(options.retrydelay)) {
        _data.retrydelay = options.retrydelay;
      } else {
        _retrydelays = [];
        _ref = options.retrydelay.split(",");
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          i = _ref[_i];
          _retrydelays.push(parseInt(i, 10));
        }
        if (!_retrydelays.length) {
          _retrydelays = null;
        } else if (_retrydelays.length === 1) {
          _retrydelays = _retrydelays[0];
        }
        if (_retrydelays != null) {
          _data.retrydelay = _retrydelays;
        }
      }
      console.log(_data);
      try {
        client.send(_data, function(err, resp) {
          if (err) {
            cli.error(e);
          } else {
            cli.ok(resp);
          }
          process.exit();
        });
      } catch (_error) {
        _err = _error;
        cli.error(_err);
      }
    });
  };

  process.on("uncaughtException", function(_err) {
    cli.error(_err);
    process.exit();
  });

}).call(this);
