(function() {
  var Queueing, async, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  utils = require("./utils");

  async = require("async");

  _ = require("lodash")._;

  module.exports = Queueing = (function(_super) {
    __extends(Queueing, _super);

    Queueing.prototype.defaults = function() {
      return this.extend(true, Queueing.__super__.defaults.apply(this, arguments), {
        intervall: [1, 2, 3, 5],
        probability: 85
      });
    };

    function Queueing(worker, Qidx, queueModule, options) {
      this.worker = worker;
      this.Qidx = Qidx;
      this.queueModule = queueModule;
      this.ERRORS = __bind(this.ERRORS, this);
      this.failed = __bind(this.failed, this);
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
      this.Message = require("./message")(this.config.messageDefaults);
      this.waitCount = 0;
      this.on("next", this.next);
      this.on("empty", this.empty);
      this.on("message", this.message);
      this.on("failed", this.failed);
      process.nextTick(function() {
        return _this.intervall();
      });
    };

    Queueing.prototype.selectNextQueue = function(cb) {
      var _i, _len, _list, _min, _q, _queues;
      _queues = this.queueModule.listQueues();
      if (_queues.length === 1) {
        cb(null, _queues[0]);
        return;
      }
      if (utils.probability(this.config.probability)) {
        _list = [];
        _min = Infinity;
        for (_i = 0, _len = _queues.length; _i < _len; _i++) {
          _q = _queues[_i];
          if (_q.emptycount < _min) {
            _min = _q.emptycount;
            _list = [];
            _list.push(_q);
          } else if (_q.emptycount === _min) {
            _list.push(_q);
          }
        }
      } else {
        _list = _queues;
      }
      this.debug("queues with lowest emptycount", _.pluck(_list, "name"));
      if (_list.length > 1) {
        cb(null, utils.arrayRandom(_list));
      } else {
        cb(null, _list[0]);
      }
    };

    Queueing.prototype.intervall = function() {
      var _this = this;
      process.nextTick(function() {
        _this.selectNextQueue(function(err, queue) {
          if (err) {
            _this.error("intervall select", err);
            _this.intervall();
            return;
          }
          _this.info("recieve", _this.Qidx, queue.name, queue.emptycount);
          queue.receive(_this);
        });
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

    Queueing.prototype.message = function(msg, meta, next, fail) {
      var _err, _msg;
      this.error("message receiverd", msg);
      try {
        _msg = new this.Message(msg, meta, this.worker);
        _msg.process(next, fail);
      } catch (_error) {
        _err = _error;
        this.error(_err);
        this.debug("error-stack", _err.stack());
        next(_err);
      }
    };

    Queueing.prototype.failed = function(msg) {
      var _this = this;
      this.info("process failed", msg.url, msg.failqueue);
      if (msg.failqueue != null) {
        this.queueModule.grabQueue(msg.failqueue, function(err, fQueue) {
          if (err != null) {
            _this.error("grab failqueue", err);
            return;
          }
          fQueue.send(msg, 0, function(err, resp) {
            if (err != null) {
              _this.error("write message to failqueue", err);
              return;
            }
            _this.debug("write message to failqueue", resp);
          });
        });
      }
    };

    Queueing.prototype.ERRORS = function() {
      return this.extend(Queueing.__super__.ERRORS.apply(this, arguments), {
        "ENOQUEUES": "No queue in list"
      });
    };

    return Queueing;

  })(require("./basic"));

}).call(this);
