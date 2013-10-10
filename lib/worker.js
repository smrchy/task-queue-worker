(function() {
  var Queueing, Redis, Worker, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Redis = require("redis");

  Queueing = require("./queueing");

  module.exports = Worker = (function(_super) {
    __extends(Worker, _super);

    function Worker() {
      this.ERRORS = __bind(this.ERRORS, this);
      this.loadQueueNamesFormConfigKey = __bind(this.loadQueueNamesFormConfigKey, this);
      this.onReady = __bind(this.onReady, this);
      this.initQueues = __bind(this.initQueues, this);
      this.initialize = __bind(this.initialize, this);
      this._validateOptions = __bind(this._validateOptions, this);
      this.defaults = __bind(this.defaults, this);
      _ref = Worker.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    Worker.prototype.defaults = function() {
      return this.extend(true, Worker.__super__.defaults.apply(this, arguments), {
        queues: "",
        configkey: null,
        taskcount: 1,
        queuetype: "rsmq",
        client: null,
        host: "127.0.0.1",
        port: 6379,
        options: {},
        ns: "taskqueueworker"
      });
    };

    Worker.prototype._validateOptions = function(options) {
      var _ref1, _ref2;
      if (!((_ref1 = options.queues) != null ? _ref1.length : void 0) && !((_ref2 = options.configkey) != null ? _ref2.length : void 0)) {
        this._handleError("config-validation", "EMISSINGQUEUES");
        return false;
      }
      return true;
    };

    Worker.prototype.initialize = function() {
      var _ref1, _ref2, _ref3,
        _this = this;
      if (((_ref1 = this.config.client) != null ? (_ref2 = _ref1.constructor) != null ? _ref2.name : void 0 : void 0) === "RedisClient") {
        this.redis = this.config.client;
      } else {
        this.config.client = this.redis = Redis.createClient(this.config.port, this.config.host, this.config.options);
      }
      if ((_ref3 = this.config.configkey) != null ? _ref3.length : void 0) {
        this.loadQueueNamesFormConfigKey(this.config.configkey, function(err) {
          if (err) {
            _this._handleError("config-validation", err);
            return;
          }
          _this.initQueues();
        });
      } else {
        this.initQueues();
      }
    };

    Worker.prototype.initQueues = function() {
      this.config.queues = this.config.queues.split(",");
      this.queueModule = require("./queueadapters/" + this.config.queuetype)(this.config);
      this.queueModule.on("ready", this.onReady);
    };

    Worker.prototype.onReady = function() {
      var i, _i, _ref1;
      for (i = _i = 1, _ref1 = this.config.taskcount; 1 <= _ref1 ? _i <= _ref1 : _i >= _ref1; i = 1 <= _ref1 ? ++_i : --_i) {
        this.debug("init a new queuing", i);
        new Queueing(this.queueModule, {
          queues: this.config.queues
        });
      }
    };

    Worker.prototype.loadQueueNamesFormConfigKey = function(configkey, cb) {
      var _this = this;
      this.redis.get(configkey, function(err, queues) {
        if (err) {
          _this._handleError(cb, err);
          return;
        }
        if (!(queues != null ? queues.length : void 0)) {
          _this._handleError(cb, "EEMPTYCONFIGKEY");
          return;
        }
        _this.config.queues = queues;
        cb(null, _this.config.queues);
      });
    };

    Worker.prototype.ERRORS = function() {
      return this.extend(Worker.__super__.ERRORS.apply(this, arguments), {
        "EMISSINGQUEUES": "You have to define the list of queues to monitor or set a `configkey`.",
        "EEMPTYCONFIGKEY": "The given config key does not contain queuenames"
      });
    };

    return Worker;

  })(require("./basic"));

}).call(this);
