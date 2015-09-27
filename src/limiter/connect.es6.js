var
  PoolRedisPromise = require('pool-redis-promise'),
  Consumer = require('./consumer');

module.exports = {
  connect
};

function connect(poolRedisConfig) {
  var
    redisConnection = new PoolRedisPromise(poolRedisConfig),
    limiter;

  limiter = {
    create,
    isBlacklisted,
    blacklist,
    TooManyRequestsError,
    BlacklistedError
  };

  limiter.TooManyRequestsError.prototype = Object.create(Error.prototype);
  limiter.BlacklistedError.prototype = Object.create(Error.prototype);

  return limiter;

  function isBlacklisted(setName, id) {
    return redisConnection.getClientAsync(exec);

    function exec(client) {
      return client.sismemberAsync(setName, id)
        .then(reply => !!reply);
    }
  }

  function blacklist(setName, ...ids) {
    return redisConnection.getClientAsync(exec);

    function exec(client) {
      return client.saddAsync(setName, ...ids);
    }
  }

  function create(config) {
    return new Consumer(redisConnection, config);
  }
}

function TooManyRequestsError(){}
function BlacklistedError(){}