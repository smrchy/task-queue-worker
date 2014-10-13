(function() {
  var Request, config, methods, urlParser, utils, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  methods = ["GET", "PUT", "POST", "DELETE"];

  urlParser = require("url");

  _ = require("lodash")._;

  config = require("./config");

  utils = require("./utils");

  Request = require("./request");

  module.exports = function(options) {
    var TMQMessage;
    return TMQMessage = (function(_super) {
      __extends(TMQMessage, _super);

      TMQMessage.prototype._singleton = false;

      TMQMessage.prototype.defaults = function() {
        return this.extend(true, TMQMessage.__super__.defaults.apply(this, arguments), {
          method: "GET",
          body: null,
          delay: 0,
          retrylimit: 3,
          retrydelay: 120,
          maxts: -1,
          timeout: 10,
          failqueue: null,
          maxredirects: 10
        });
      };

      function TMQMessage(data, meta, worker) {
        var _k, _v;
        this.meta = meta;
        this.worker = worker;
        this.ERRORS = __bind(this.ERRORS, this);
        this._dispose = __bind(this._dispose, this);
        this.defineProperties = __bind(this.defineProperties, this);
        this.process = __bind(this.process, this);
        this.getDelay = __bind(this.getDelay, this);
        this.getRetryDelay = __bind(this.getRetryDelay, this);
        this.toString = __bind(this.toString, this);
        this.toJSON = __bind(this.toJSON, this);
        this.defaults = __bind(this.defaults, this);
        TMQMessage.__super__.constructor.call(this, options);
        this.debug("config", this.config);
        this.defineProperties();
        if (_.isString(data)) {
          try {
            data = JSON.parse(data);
          } catch (_error) {}
        }
        this.debug("info", data, meta);
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

      TMQMessage.prototype.toJSON = function() {
        return _.pick(this, ["url", "method", "body", "retrylimit", "retrydelay", "delay", "maxts", "timeout", "failqueue", "maxredirects"]);
      };

      TMQMessage.prototype.toString = function() {
        return JSON.stringify(this.toJSON());
      };

      TMQMessage.prototype.getRetryDelay = function(retries) {
        if (_.isArray(this.retrydelay)) {
          if (this.retrydelay[retries] != null) {
            return this.retrydelay[retries];
          } else {
            return _.last(this.retrydelay);
          }
        }
        return this.retrydelay;
      };

      TMQMessage.prototype.getDelay = function() {
        var _ref, _retry;
        if ((((_ref = this.meta) != null ? _ref.receiveCount : void 0) || 0) < 1) {
          return this.delay;
        } else {
          _retry = this.getRetryDelay(this.meta.receiveCount);
          if (this.delay > _retry) {
            return this.delay;
          } else {
            return _retry;
          }
        }
      };

      TMQMessage.prototype.process = function(next, fail) {
        if (this.meta.receiveCount > this.retrylimit) {
          fail(this._handleError(true, "EREACHEDRETRYLIMIT"), this);
          this._dispose();
          return;
        }
        if (this.maxts >= 0 && utils.now() > this.maxts) {
          fail(this._handleError(true, "EEXPIRED"), this);
          this._dispose();
          return;
        }
        this.debug("process message", this.toJSON());
        new Request(this).exec((function(_this) {
          return function() {
            next.apply(arguments);
            _this._dispose();
          };
        })(this));
      };

      TMQMessage.prototype.defineProperties = function() {
        this.data = {
          headers: {}
        };
        this.define("url", ((function(_this) {
          return function() {
            return _this.data.url;
          };
        })(this)), ((function(_this) {
          return function(url) {
            if (!_.isString(url) || !utils.isUrl(url)) {
              _this._handleError(null, "EINVALIDURL");
              return;
            }
            _this.data.url = url;
          };
        })(this)));
        this.define("method", ((function(_this) {
          return function() {
            if (_this.body != null) {
              return "POST";
            } else {
              return _this.data.method || _this.config.method;
            }
          };
        })(this)), ((function(_this) {
          return function(method) {
            if (__indexOf.call(methods, method) < 0) {
              _this.warning("invalid `method` so use default `" + _this.config.method + "`. Only method of `" + (methods.join(", ")) + "` are allowed");
              return;
            }
            _this.data.method = method;
          };
        })(this)));
        this.data.hasJSONBody = false;
        this.data.headers["Content-Type"] = "appliction/x-www-form-urlencoded";
        this.define("body", ((function(_this) {
          return function() {
            return _this.data.body;
          };
        })(this)), ((function(_this) {
          return function(body) {
            if (_.isObject(body)) {
              _this.data.body = body;
              _this.data.headers["Content-Type"] = "application/json";
              _this.data.hasJSONBody = true;
              return;
            }
            try {
              _this.data.body = JSON.parse(body);
              _this.data.headers["Content-Type"] = "application/json";
              _this.data.hasJSONBody = true;
            } catch (_error) {
              _this.data.body = body;
            }
          };
        })(this)));
        this.getter("httpHeaders", (function(_this) {
          return function() {
            return _this.data.headers;
          };
        })(this));
        this.getter("hasBody", (function(_this) {
          return function() {
            return _this.data.body != null;
          };
        })(this));
        this.getter("hasJSONBody", (function(_this) {
          return function() {
            return _this.data.hasJSONBody;
          };
        })(this));
        ["retrylimit", "retrydelay", "maxts", "timeout", "failqueue", "maxredirects", "delay"].forEach((function(_this) {
          return function(_k) {
            return _this.define(_k, (function() {
              return _this.data[_k] || _this.config[_k];
            }), (function(_v) {
              switch (_k) {
                case "retrylimit":
                case "retrydelay":
                case "maxts":
                case "timeout":
                case "maxredirects":
                case "delay":
                  if (!_.isNumber(_v)) {
                    _this.warning("invalid `" + _k + "` so use default `" + _this.config[_k] + "`");
                    return;
                  }
                  break;
                case "failqueue":
                  if ((_v != null) && !_.isString(_v)) {
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
              _this.debug("set msg props", _k, _v);
              _this.data[_k] = _v;
            }));
          };
        })(this));
      };

      TMQMessage.prototype._dispose = function() {
        this.meta = null;
        this.worker = null;
        this.config = null;
        this.removeAllListeners();
        delete this;
      };

      TMQMessage.prototype.ERRORS = function() {
        return this.extend(TMQMessage.__super__.ERRORS.apply(this, arguments), {
          "EMISSINGURL": [409, "You have to define at least a url."],
          "EINVALIDURL": [409, "The url has to be a string and a valid url with leading protokoll. E.g.( http://www.google.com )"],
          "EINVALIDMETHOD": [409, "Only method of `" + (methods.join(", ")) + "` are allowed"],
          "EREACHEDRETRYLIMIT": [500, "This message reached it's retry limit. So delete it."],
          "EEXPIRED": [500, "This message reached it's `maxts` limit. So delete it."]
        });
      };

      return TMQMessage;

    })(require("mpbasic")(config));
  };

}).call(this);
