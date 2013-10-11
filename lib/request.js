(function() {
  var Request, request,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  request = require("request");

  module.exports = Request = (function(_super) {
    __extends(Request, _super);

    function Request(msg, options) {
      this.msg = msg;
      this.ERRORS = __bind(this.ERRORS, this);
      this._handle = __bind(this._handle, this);
      this.exec = __bind(this.exec, this);
      Request.__super__.constructor.call(this, options);
      return;
    }

    Request.prototype.exec = function(cb) {
      var _body, _opt;
      _opt = {
        url: this.msg.url,
        method: this.msg.method,
        headers: this.msg.httpHeaders,
        timeout: this.msg.timeout
      };
      _body = this.msg.body;
      if (this.msg.hasBody) {
        if (this.msg.hasJSONBody) {
          _opt.json = this.msg.body;
        } else {
          _opt.body = this.msg.body;
        }
      }
      if (this.msg.maxredirects > 0) {
        _opt.followRedirect = true;
        _opt.maxRedirects = this.msg.maxRedirects;
      } else {
        _opt.followRedirect = false;
      }
      this.info("call http", _opt);
      request(_opt, this._handle(cb));
    };

    Request.prototype._handle = function(cb) {
      var _this = this;
      return function(err, req) {
        var _ref;
        if (_this.msg.worker != null) {
          _this.msg.worker.emit("request:body", req != null ? req.body : void 0);
        }
        if (err) {
          cb(err);
          return;
        }
        if (req.statusCode >= 200 && req.statusCode < 300) {
          _this.info("http OK", req.statusCode);
          cb(null);
          return;
        }
        _this.warning("Answerd with status Code: " + req.statusCode, req != null ? (_ref = req.request) != null ? _ref.href : void 0 : void 0);
        _this._handleError(cb, "ENOT2XX");
      };
    };

    Request.prototype.ERRORS = function() {
      return this.extend(Request.__super__.ERRORS.apply(this, arguments), "ENOT2XX", "The http response is not type of 200");
    };

    return Request;

  })(require("./basic"));

}).call(this);
