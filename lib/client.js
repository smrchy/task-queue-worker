(function() {
  var Message, Redis, TQWClient, config,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Redis = require("redis");

  config = require("./config");

  Message = require("./message");

  module.exports = TQWClient = (function(_super) {
    __extends(TQWClient, _super);

    function TQWClient() {
      this.ERRORS = __bind(this.ERRORS, this);
      this._send = __bind(this._send, this);
      this.send = __bind(this.send, this);
      this.onReady = __bind(this.onReady, this);
      this.initialize = __bind(this.initialize, this);
      this._validateOptions = __bind(this._validateOptions, this);
      this.defaults = __bind(this.defaults, this);
      return TQWClient.__super__.constructor.apply(this, arguments);
    }

    TQWClient.prototype.defaults = function() {
      return this.extend(true, TQWClient.__super__.defaults.apply(this, arguments), {
        queue: "",
        queuetype: "rsmq",
        client: null,
        host: "127.0.0.1",
        port: 6379,
        options: {},
        ns: "taskqueueworker",
        messageDefaults: {}
      });
    };

    TQWClient.prototype._validateOptions = function(options) {
      var _ref;
      if (!((_ref = options.queue) != null ? _ref.length : void 0)) {
        this._handleError(null, "EMISSINGQUEUE");
        return false;
      }
      return true;
    };

    TQWClient.prototype.initialize = function() {
      this.connected = false;
      this.Message = require("./message")(this.config.messageDefaults);
      config.queues = [this.config.queue];
      this.config.queues = [this.config.queue];
      this.queueModule = require("./queueadapters/" + this.config.queuetype)(this.config);
      this.queueModule.on("ready", this.onReady);
    };

    TQWClient.prototype.onReady = function() {
      this.queue = this.queueModule.getQueue(this.config.queue);
      if (this.queue == null) {
        this._handleError(null, "EQUEUENOTAVAIL");
        return;
      }
      this.connected = true;
      this.emit("connected");
    };

    TQWClient.prototype.send = function(msg, cb) {
      if (this.connected) {
        this._send(msg, cb);
      } else {
        this.once("connected", (function(_this) {
          return function() {
            _this._send(msg, cb);
          };
        })(this));
      }
    };

    TQWClient.prototype._send = function(msg, cb) {
      var _msg;
      _msg = new this.Message(msg);
      this.queue.send(_msg, 0, (function(_this) {
        return function(err, resp) {
          if (err) {
            _this._handleError(cb, err);
            return;
          }
          if (cb != null) {
            cb(null, resp);
            return;
          }
          _this.debug("send done", resp);
        };
      })(this));
    };

    TQWClient.prototype.ERRORS = function() {
      return this.extend(TQWClient.__super__.ERRORS.apply(this, arguments), {
        "EMISSINGQUEUE": [409, "You have to define a queue name to use"],
        "EQUEUENOTAVAIL": [404, "The given queue is not availible"]
      });
    };

    return TQWClient;

  })(require("mpbasic")(config));

}).call(this);
