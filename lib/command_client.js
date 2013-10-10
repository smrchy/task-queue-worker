(function() {
  var TQC, cli;

  cli = require('cli').enable('help', 'status');

  TQC = require("./client");

  exports.run = function() {
    cli.parse({
      queue: ["q", "Name of the queue to send", "string"],
      url: ["u", "url to call", "string"],
      method: ["m", "the http method to use.", ["GET", "POST", "PUT", "DELETE"], "GET"],
      body: ["b", "a json body to send", "string", ""]
    });
    cli.main(function(args, options) {
      var client, _data,
        _this = this;
      client = new TQC({
        queue: options.queue
      });
      _data = {
        url: options.url,
        method: options.method,
        body: options.body
      };
      client.send(_data, function(err, resp) {
        if (err) {
          cli.error(e);
        } else {
          cli.ok(resp);
        }
        process.exit();
      });
    });
  };

}).call(this);
