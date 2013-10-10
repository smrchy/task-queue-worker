(function() {
  var RedisMQ, async,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  RedisMQ = require("rsmq");

  async = require("async");

  module.exports = function(config) {
    var RSMQAdapter, RSMQQueue, _ref;
    RSMQQueue = (function(_super) {
      __extends(RSMQQueue, _super);

      RSMQQueue.prototype.defaults = function() {
        return this.extend(true, RSMQQueue.__super__.defaults.apply(this, arguments), {
          name: null
        });
      };

      function RSMQQueue(rsmq, options) {
        this.rsmq = rsmq;
        this.del = __bind(this.del, this);
        this.receive = __bind(this.receive, this);
        this.send = __bind(this.send, this);
        this.initialize = __bind(this.initialize, this);
        this.defaults = __bind(this.defaults, this);
        RSMQQueue.__super__.constructor.call(this, options);
        return;
      }

      RSMQQueue.prototype.initialize = function() {
        var _this = this;
        return this.getter("name", function() {
          return _this.config.name;
        });
      };

      RSMQQueue.prototype.send = function(msg, cb) {
        var _data,
          _this = this;
        _data = {
          qname: this.config.name,
          message: msg.toString(),
          delay: msg.getDelay()
        };
        this.debug("send", _data);
        this.rsmq.sendMessage(_data, function(err, resp) {
          if (err) {
            _this.error("send pending queue message", err);
            if (cb != null) {
              cb(err);
            }
            return;
          }
          _this.emit("new", resp);
          if (cb != null) {
            cb(null, resp);
          }
        });
      };

      RSMQQueue.prototype.receive = function() {
        var _this = this;
        this.debug("start receive");
        this.rsmq.receiveMessage({
          qname: this.config.name
        }, function(err, msg) {
          var _fnNext, _id, _meta;
          _this.debug("received", msg);
          if (err) {
            _this.emit("next");
            _this.error("receive queue message", err);
            return;
          }
          if (msg != null ? msg.id : void 0) {
            _id = msg.id;
            _fnNext = function(err) {
              if (err) {
                _this.del(_id);
              }
              _this.emit("next");
            };
            _meta = {
              receiveCount: msg.rc,
              firstReceive: msg.fr,
              created: msg.sent
            };
            _this.emit("message", msg.message, _meta, _fnNext);
          } else {
            _this.emit("empty");
          }
        });
      };

      RSMQQueue.prototype.del = function(id) {
        var _this = this;
        this.rsmq.deleteMessage({
          qname: this.config.name,
          id: id
        }, function(err, resp) {});
        if (err) {
          this.error("delete queue message", err);
          return;
        }
        this.debug("delete queue message", resp);
      };

      return RSMQQueue;

    })(require("../basic"));
    RSMQAdapter = (function(_super) {
      __extends(RSMQAdapter, _super);

      function RSMQAdapter() {
        this.listQueues = __bind(this.listQueues, this);
        this.getQueue = __bind(this.getQueue, this);
        this.initQueue = __bind(this.initQueue, this);
        this.initQueues = __bind(this.initQueues, this);
        this.initialize = __bind(this.initialize, this);
        this.defaults = __bind(this.defaults, this);
        _ref = RSMQAdapter.__super__.constructor.apply(this, arguments);
        return _ref;
      }

      RSMQAdapter.prototype.defaults = function() {
        return this.extend(true, RSMQAdapter.__super__.defaults.apply(this, arguments), {
          queues: [],
          client: null,
          host: "127.0.0.1",
          port: 6379,
          options: {},
          ns: "taskqueueworker"
        });
      };

      RSMQAdapter.prototype.initialize = function() {
        var _this = this;
        this.rsmq = new RedisMQ(this.config);
        this.queues = {};
        this.on("queue:ready", function(name) {
          var _q;
          _q = new RSMQQueue(_this.rsmq, {
            name: name
          });
          _q.on("new", function(resp) {
            return _this.emit("new", name, resp);
          });
          _q.on("message", function(message, meta, next) {
            return _this.emit("message", name, message, meta, next);
          });
          _q.on("next", function() {
            return _this.emit("next", name);
          });
          _q.on("empty", function() {
            return _this.emit("empty", name);
          });
          _this.queues[name] = _q;
        });
        if (this.rsmq.connected) {
          this.initQueue();
        } else {
          this.rsmq.once("connect", this.initQueues);
        }
      };

      RSMQAdapter.prototype.initQueues = function() {
        var _this = this;
        this.debug("init rsmq queues", this.config.queues);
        async.each(this.config.queues, this.initQueue, function(err) {
          if (err) {
            _this._handeError("queue-init", err);
            return;
          }
          _this.debug("init rsmq queues done");
          _this.emit("ready");
        });
      };

      RSMQAdapter.prototype.initQueue = function(queue, cb) {
        var _this = this;
        this.rsmq.createQueue({
          qname: queue
        }, function(err, resp) {
          if ((err != null ? err.name : void 0) === "queueExists") {
            _this.debug("queue allready existed");
            _this.emit("queue:ready", queue);
            cb(null);
            return;
          }
          if (err) {
            cb(err);
            return;
          }
          if (resp === 1) {
            _this.debug("queue created");
          } else {
            _this.debug("queue allready existed");
          }
          _this.emit("queue:ready", queue);
          cb(null);
        });
      };

      RSMQAdapter.prototype.getQueue = function(name) {
        if (this.queues[name] != null) {
          return this.queues[name];
        } else {
          return null;
        }
      };

      RSMQAdapter.prototype.listQueues = function() {
        var queue, ret, _n, _ref1;
        ret = [];
        _ref1 = this.queues;
        for (_n in _ref1) {
          queue = _ref1[_n];
          ret.push(queue);
        }
        return ret;
      };

      return RSMQAdapter;

    })(require("../basic"));
    return new RSMQAdapter(config);
  };

}).call(this);
