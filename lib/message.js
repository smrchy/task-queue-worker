(function() {
  var Message, methods, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  methods = ["GET", "PUT", "POST", "DELETE"];

  _ = require("lodash")._;

  module.exports = Message = (function(_super) {
    __extends(Message, _super);

    Message.prototype._singleton = false;

    Message.prototype.defaults = function() {
      return this.extend(true, Message.__super__.defaults.apply(this, arguments), {
        method: "GET",
        body: null,
        retrylimit: 3,
        retrydelay: 120,
        maxts: -1,
        timeout: 10,
        failqueue: null,
        maxredirects: 10
      });
    };

    function Message(data, meta, options) {
      var _k, _v;
      if (options == null) {
        options = {};
      }
      this.ERRORS = __bind(this.ERRORS, this);
      this.defineProperties = __bind(this.defineProperties, this);
      this.process = __bind(this.process, this);
      this.getDelay = __bind(this.getDelay, this);
      this.toString = __bind(this.toString, this);
      this.toJSON = __bind(this.toJSON, this);
      this.defaults = __bind(this.defaults, this);
      Message.__super__.constructor.call(this, options);
      this.defineProperties();
      if (_.isString(data)) {
        try {
          data = JSON.parse(data);
        } catch (_error) {}
      }
      this.debug("info", data);
      if (data.url == null) {
        this._handleError(null, "EMISSINGURL");
        return;
      }
      for (_k in data) {
        _v = data[_k];
        this[_k] = _v;
      }
      return;
    }

    Message.prototype.toJSON = function() {
      return _.pick(this, ["url", "method", "body", "retrylimit", "retrydelay", "maxts", "timeout", "failqueue", "maxredirects"]);
    };

    Message.prototype.toString = function() {
      return JSON.stringify(this.toJSON());
    };

    Message.prototype.getDelay = function() {
      if (_.isArray(this.retrydelay)) {
        return this.retrydelay[0];
      }
      return this.retrydelay;
    };

    Message.prototype.process = function(cb) {
      console.log("PROCESS", this.toJSON());
    };

    Message.prototype.defineProperties = function() {
      var _i, _k, _len, _ref,
        _this = this;
      this.data = {
        headers: {}
      };
      this.define("url", (function() {
        return _this.data.url;
      }), (function(url) {
        if (!_.isString(url)) {
          _this._handleError(null, "EINVALIDURL");
          return;
        }
        _this.data.url = url;
      }));
      this.define("method", (function() {
        if (_this.body != null) {
          return "POST";
        } else {
          return _this.data.method || _this.config.method;
        }
      }), (function(method) {
        if (__indexOf.call(methods, method) < 0) {
          _this.warning("invalid `method` so use default `" + _this.config.method + "`. Only method of `" + (methods.join(", ")) + "` are allowed");
          return;
        }
        _this.data.method = method;
      }));
      this.data.headers["Content-Type"] = "appliction/x-www-form-urlencoded";
      this.define("body", (function() {
        return _this.data.body;
      }), (function(body) {
        if (_.isObject(body)) {
          _this.data.body = body;
          _this.config.headers["Content-Type"] = "application/json";
          return;
        }
        try {
          _this.data.body = JSON.parse(body);
          _this.data.headers["Content-Type"] = "application/json";
        } catch (_error) {
          _this.data.body = body;
        }
      }));
      _ref = ["retrylimit", "retrydelay", "maxts", "timeout", "failqueue", "maxredirects"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _k = _ref[_i];
        this.define(_k, (function() {
          return _this.data[_k] || _this.config[_k];
        }), (function(_v) {
          switch (_k) {
            case "retrylimit":
            case "retrydelay":
            case "maxts":
            case "timeout":
            case "maxredirects":
              if (!_.isNumber(_v)) {
                _this.warning("invalid `" + _k + "` so use default `" + _this.config[_k] + "`");
                return;
              }
              break;
            case "failqueue":
              if (!_.isString(_v)) {
                _this.warning("invalid `" + _k + "` so use default `" + _this.config[_k] + "`");
                return;
              }
              break;
            case "retrydelay":
              if (!_.isNumber(_v) && !(_.isArray(_v) && _v.length)) {
                _this.warning("invalid `" + _k + "` so use default `" + _this.config[_k] + "`");
                return;
              }
          }
          _this.data[_k] = _v;
        }));
      }
    };

    Message.prototype.ERRORS = function() {
      return this.extend(Message.__super__.ERRORS.apply(this, arguments), "EMISSINGURL", "You have to define at least a url.", {
        "EINVALIDURL": "The url has to be a string",
        "EINVALIDMETHOD": "Only method of `" + (methods.join(", ")) + "` are allowed"
      });
    };

    return Message;

  })(require("./basic"));

}).call(this);
