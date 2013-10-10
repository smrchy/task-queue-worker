(function() {
  var Message, Queueing, async, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  utils = require("./utils");

  async = require("async");

  _ = require("lodash")._;

  Message = require("./message");

  module.exports = Queueing = (function(_super) {
    __extends(Queueing, _super);

    Queueing.prototype.defaults = function() {
      return this.extend(true, Queueing.__super__.defaults.apply(this, arguments), {
        intervall: [0, 1, 5, 10]
      });
    };

    function Queueing(qeueModule, options) {
      this.qeueModule = qeueModule;
      this.ERRORS = __bind(this.ERRORS, this);
      this.message = __bind(this.message, this);
      this.empty = __bind(this.empty, this);
      this.next = __bind(this.next, this);
      this.intervall = __bind(this.intervall, this);
      this.selectNextQueue = __bind(this.selectNextQueue, this);
      this.initialize = __bind(this.initialize, this);
      this.defaults = __bind(this.defaults, this);
      Queueing.__super__.constructor.call(this, options);
      return;
    }

    Queueing.prototype.initialize = function() {
      var _this = this;
      this.waitCount = 0;
      this.qeueModule.on("next", this.next);
      this.qeueModule.on("empty", this.empty);
      this.qeueModule.on("message", this.message);
      process.nextTick(function() {
        return _this.intervall();
      });
    };

    Queueing.prototype.selectNextQueue = function(cb) {
      var _list;
      _list = this.qeueModule.listQueues();
      if (_list.length > 1) {
        cb(null, utils.arrayRandom(_list));
      } else {
        cb(null, _list[0]);
      }
    };

    Queueing.prototype.intervall = function() {
      var _this = this;
      this.selectNextQueue(function(err, queue) {
        if (err) {
          _this.error("intervall select", err);
          _this.intervall();
          return;
        }
        _this.debug("recieve", queue.name);
        queue.receive();
      });
    };

    Queueing.prototype.next = function() {
      this.debug("next", this.waitCount);
      this.waitCount = 0;
      this.intervall();
    };

    Queueing.prototype.empty = function() {
      var _timeout;
      this.debug("empty");
      if (this.timeout != null) {
        clearTimeout(this.timeout);
      }
      if (_.isArray(this.config.intervall)) {
        _timeout = this.config.intervall[this.waitCount] != null ? this.config.intervall[this.waitCount] : _.last(this.config.intervall);
      } else {
        _timeout = this.config.intervall;
      }
      this.debug("wait", this.waitCount, _timeout);
      this.timeout = _.delay(this.intervall, _timeout * 1000);
      this.waitCount++;
    };

    Queueing.prototype.message = function(queuename, msg, meta, next) {
      var _msg;
      _msg = new Message(msg, meta);
      _msg.process(next);
    };

    Queueing.prototype.ERRORS = function() {
      return this.extend(Queueing.__super__.ERRORS.apply(this, arguments), {
        "ENOQUEUES": "No queue in list"
      });
    };

    return Queueing;

  })(require("./basic"));

}).call(this);
