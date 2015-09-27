'use strict';

var PoolRedisPromise = require('pool-redis-promise'),
    Consumer = require('./consumer');

module.exports = {
  connect: connect
};

function connect(poolRedisConfig) {
  var redisConnection = new PoolRedisPromise(poolRedisConfig),
      limiter;

  limiter = {
    create: create,
    isBlacklisted: isBlacklisted,
    blacklist: blacklist,
    TooManyRequestsError: TooManyRequestsError,
    BlacklistedError: BlacklistedError
  };

  limiter.TooManyRequestsError.prototype = Object.create(Error.prototype);
  limiter.BlacklistedError.prototype = Object.create(Error.prototype);

  return limiter;

  function isBlacklisted(setName, id) {
    return redisConnection.getClientAsync(exec);

    function exec(client) {
      return client.sismemberAsync(setName, id).then(function (reply) {
        return !!reply;
      });
    }
  }

  function blacklist(setName) {
    for (var _len = arguments.length, ids = Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
      ids[_key - 1] = arguments[_key];
    }

    return redisConnection.getClientAsync(exec);

    function exec(client) {
      return client.saddAsync.apply(client, [setName].concat(ids));
    }
  }

  function create(config) {
    return new Consumer(redisConnection, config);
  }
}

function TooManyRequestsError() {}
function BlacklistedError() {}
