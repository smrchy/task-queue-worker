(function() {
  var BaseAdapter, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = BaseAdapter = (function(_super) {
    __extends(BaseAdapter, _super);

    function BaseAdapter() {
      this.defaults = __bind(this.defaults, this);
      _ref = BaseAdapter.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    BaseAdapter.prototype.defaults = function() {
      return this.extend(true, BaseAdapter.__super__.defaults.apply(this, arguments), {
        queues: []
      });
    };

    return BaseAdapter;

  })(require("../basic"));

}).call(this);
