'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Consumer = (function () {
  function Consumer(redisClientPool, _ref) {
    var _ref$limit = _ref.limit;
    var limit = _ref$limit === undefined ? 0 : _ref$limit;
    var _ref$interval = _ref.interval;
    var interval = _ref$interval === undefined ? 1 : _ref$interval;
    var _ref$namespace = _ref.namespace;
    var namespace = _ref$namespace === undefined ? 'limiter' : _ref$namespace;

    _classCallCheck(this, Consumer);

    this.limit = limit;
    this.interval = interval; // seconds
    this.namespace = namespace;
    this.redisClientPool = redisClientPool;
  }

  _createClass(Consumer, [{
    key: 'consume',
    value: function consume(id) {
      var self = this;

      return self.redisClientPool.getClientAsync(exec);

      function exec(client) {
        return client.hincrbyAsync(self.namespace + ':' + id, 'usage', 1).then(checkUsage).then(_returnConsumer.bind(self, id));

        function checkUsage(usage) {
          if (usage > 1) {
            return usage;
          }

          // this is a new consumer so we need to set the expiration on the record
          return client.expireAsync(self.namespace + ':' + id, self.interval)['return'](usage);
        }
      }
    }
  }, {
    key: 'query',
    value: function query(id) {
      var self = this;

      return self.redisClientPool.getClientAsync(exec);

      function exec(client) {
        return client.hgetAsync(self.namespace + ':' + id, 'usage').then(_returnConsumer.bind(self, id));
      }
    }
  }]);

  return Consumer;
})();

module.exports = Consumer;

function _returnConsumer(id, usage) {
  usage = parseInt(usage, 10);

  return {
    id: id,
    usage: usage,
    limit: this.limit,
    interval: this.interval,
    allowed: this.limit >= usage
  };
}
