(function() {
  var Message, Redis, Worker, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Redis = require("redis");

  Message = require("./message");

  module.exports = Worker = (function(_super) {
    __extends(Worker, _super);

    function Worker() {
      this.ERRORS = __bind(this.ERRORS, this);
      this._send = __bind(this._send, this);
      this.send = __bind(this.send, this);
      this.onReady = __bind(this.onReady, this);
      this.initialize = __bind(this.initialize, this);
      this._validateOptions = __bind(this._validateOptions, this);
      this.defaults = __bind(this.defaults, this);
      _ref = Worker.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Worker.prototype.defaults = function() {
      return this.extend(true, Worker.__super__.defaults.apply(this, arguments), {
        queue: "",
        queuetype: "rsmq",
        client: null,
        host: "127.0.0.1",
        port: 6379,
        options: {},
        ns: "taskqueueworker"
      });
    };

    Worker.prototype._validateOptions = function(options) {
      var _ref1;
      if (!((_ref1 = options.queue) != null ? _ref1.length : void 0)) {
        this._handleError(null, "EMISSINGQUEUE");
        return false;
      }
      return true;
    };

    Worker.prototype.initialize = function() {
      this.connected = false;
      this.config.queues = [this.config.queue];
      this.queueModule = require("./queueadapters/" + this.config.queuetype)(this.config);
      this.queueModule.on("ready", this.onReady);
    };

    Worker.prototype.onReady = function() {
      this.queue = this.queueModule.getQueue(this.config.queue);
      if (this.queue == null) {
        this._handleError(null, "EQUEUENOTAVAIL");
        return;
      }
      this.connected = true;
      this.emit("connected");
    };

    Worker.prototype.send = function(msg, cb) {
      var _this = this;
      if (this.connected) {
        this._send(msg, cb);
      } else {
        this.once("connected", function() {
          _this._send(msg, cb);
        });
      }
    };

    Worker.prototype._send = function(msg, cb) {
      var _msg,
        _this = this;
      _msg = new Message(msg);
      this.queue.send(_msg, function(err, resp) {
        if (err) {
          _this._handleError(cb, err);
          return;
        }
        if (cb != null) {
          cb(null, resp);
          return;
        }
        _this.debug("send done", resp);
      });
    };

    Worker.prototype.ERRORS = function() {
      return this.extend(Worker.__super__.ERRORS.apply(this, arguments), {
        "EMISSINGQUEUE": "You have to define a queue name to use",
        "EQUEUENOTAVAIL": "The gien queue is not availible"
      });
    };

    return Worker;

  })(require("./basic"));

}).call(this);
