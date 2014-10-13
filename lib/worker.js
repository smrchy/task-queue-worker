(function() {
  var Queueing, Redis, TQWWorker, config,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  Redis = require("redis");

  Queueing = require("./queueing");

  config = require("./config");

  module.exports = TQWWorker = (function(_super) {
    __extends(TQWWorker, _super);

    function TQWWorker() {
      this.ERRORS = __bind(this.ERRORS, this);
      this.loadQueueNamesFormConfigKey = __bind(this.loadQueueNamesFormConfigKey, this);
      this.onReady = __bind(this.onReady, this);
      this.initQueues = __bind(this.initQueues, this);
      this.initialize = __bind(this.initialize, this);
      this._validateOptions = __bind(this._validateOptions, this);
      this.defaults = __bind(this.defaults, this);
      return TQWWorker.__super__.constructor.apply(this, arguments);
    }

    TQWWorker.prototype.defaults = function() {
      return this.extend(true, TQWWorker.__super__.defaults.apply(this, arguments), {
        queues: "",
        configkey: null,
        taskcount: 1,
        queuetype: "rsmq",
        client: null,
        host: "127.0.0.1",
        port: 6379,
        options: {},
        ns: "taskqueueworker",
        messageDefaults: {}
      });
    };

    TQWWorker.prototype._validateOptions = function() {
      var _ref, _ref1;
      if (!((_ref = this.config.queues) != null ? _ref.length : void 0) && !((_ref1 = this.config.configkey) != null ? _ref1.length : void 0)) {
        this._handleError(false, "EMISSINGQUEUES");
      }
    };

    TQWWorker.prototype.initialize = function() {
      var _ref, _ref1, _ref2;
      this._validateOptions();
      if (((_ref = this.config.client) != null ? (_ref1 = _ref.constructor) != null ? _ref1.name : void 0 : void 0) === "RedisClient") {
        this.redis = this.config.client;
      } else {
        this.config.client = this.redis = Redis.createClient(this.config.port, this.config.host, this.config.options);
      }
      if ((_ref2 = this.config.configkey) != null ? _ref2.length : void 0) {
        this.loadQueueNamesFormConfigKey(this.config.configkey, (function(_this) {
          return function(err) {
            if (err) {
              _this._handleError("config-validation", err);
              return;
            }
            _this.initQueues();
          };
        })(this));
      } else {
        this.initQueues();
      }
    };

    TQWWorker.prototype.initQueues = function() {
      var _ref;
      if (!this.config.queues && ((_ref = this.config.queues.split(",")) != null ? _ref.length : void 0) <= 0) {
        this._handleError("config-validation", err);
        return;
      }
      config.queues = this.config.queues = this.config.queues.split(",");
      this.queueModule = require("./queueadapters/" + this.config.queuetype)();
      this.queueModule.on("ready", this.onReady);
    };

    TQWWorker.prototype.onReady = function() {
      var i, _i, _ref;
      for (i = _i = 1, _ref = this.config.taskcount; 1 <= _ref ? _i <= _ref : _i >= _ref; i = 1 <= _ref ? ++_i : --_i) {
        this.debug("init a new queuing", i);
        new Queueing(this, i, this.queueModule, {
          queues: this.config.queues,
          messageDefaults: this.config.messageDefaults
        });
      }
    };

    TQWWorker.prototype.loadQueueNamesFormConfigKey = function(configkey, cb) {
      this.redis.get(configkey, (function(_this) {
        return function(err, queues) {
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
        };
      })(this));
    };

    TQWWorker.prototype.ERRORS = function() {
      return this.extend(TQWWorker.__super__.ERRORS.apply(this, arguments), {
        "EMISSINGQUEUES": [409, "You have to define the list of queues to monitor or set a `configkey`."],
        "EEMPTYCONFIGKEY": [409, "The given config key does not contain queuenames"]
      });
    };

    return TQWWorker;

  })(require("mpbasic")(config));

}).call(this);
