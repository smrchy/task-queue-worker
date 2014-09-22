(function() {
  var Config, DEFAULT, extend, pckg, _err, _localconf,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DEFAULT = {
    queues: [],
    client: null,
    host: "127.0.0.1",
    port: 6379,
    options: {},
    ns: "taskqueueworker"
  };

  extend = require("extend");

  pckg = require("../package.json");

  try {
    _localconf = require("../config.json");
  } catch (_error) {
    _err = _error;
    if ((_err != null ? _err.code : void 0) === "MODULE_NOT_FOUND") {
      _localconf = {};
    } else {
      throw _err;
    }
  }

  Config = (function() {
    function Config(severity) {
      this.severity = severity != null ? severity : "info";
      this.get = __bind(this.get, this);
      this.all = __bind(this.all, this);
      this.init = __bind(this.init, this);
      return;
    }

    Config.prototype.init = function(input) {
      this.config = extend(true, {}, DEFAULT, _localconf, input, {
        version: pckg.version
      });
      this._inited = true;
    };

    Config.prototype.all = function(logging) {
      var _all, _k, _v;
      if (logging == null) {
        logging = false;
      }
      if (!this._inited) {
        this.init({});
      }
      _all = (function() {
        var _i, _len, _ref, _results;
        _ref = this.config;
        _results = [];
        for (_v = _i = 0, _len = _ref.length; _i < _len; _v = ++_i) {
          _k = _ref[_v];
          _results.push(this.get(_k, logging));
        }
        return _results;
      }).call(this);
      return _all;
    };

    Config.prototype.get = function(name, logging) {
      var _cnf, _ref;
      if (logging == null) {
        logging = false;
      }
      if (!this._inited) {
        this.init({});
      }
      if ((name == null) || name === "_global") {
        _cnf = this.config;
      } else {
        _cnf = ((_ref = this.config) != null ? _ref[name] : void 0) || null;
      }
      if (logging) {
        logging = {
          logging: {
            severity: process.env["severitytqw"] || process.env["severity_" + name] || this.severity,
            severitys: "fatal,error,warning,info,debug".split(",")
          }
        };
        return extend(true, {}, logging, _cnf);
      } else {
        return _cnf;
      }
    };

    return Config;

  })();

  module.exports = new Config(process.env.severity);

}).call(this);
