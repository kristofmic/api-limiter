API-Limiter
================

API-Limiter provides a simple module for throttling APIs, velocity checking usage (e.g., login attempts), and blacklisting requests for resources. The module is backed by Redis for data persistence. The module relies on the [pool-redis-promise](https://www.npmjs.com/package/pool-redis-promise) package for connecting to Redis via a client pool for more efficient querying.

## Usage

The Limiter is initialized via a `connect()` call to establish a connection to Redis, setting up the client pool. The Redis configuration follows the defaults outlined in the pool-redis-promise package [here](https://www.npmjs.com/package/pool-redis-promise#default-configuration).

The `connect()` method returns an object that exposes a `create()` factory method for creating new Limiter instances, static methods for blacklisting and checking blacklisted keys (via `blacklist()` and `isBlacklisted()` respectively), and custome errors to be used in promise-based catch statements (i.e., for handling specific errors when the key is blacklisted or is being rate limited versus more generic errors like a connection timeout).

## API

### #connect(poolRedisPromiseConfig)

`require('api-limiter').connect([poolRedisPromiseConfig])`

Establishes a connection to Redis via the [pool-redis-promise](https://www.npmjs.com/package/pool-redis-promise) package.

**Arguments**

1. [poolRedisPromiseConfig] *(Object)*: *Optional* Configuration settings (see [pool-redis-promise default config](https://www.npmjs.com/package/pool-redis-promise#default-configuration).

**Returns**

Object with factory method to create new limiters, static methods for blacklisting and checking if a key is blacklisted, and custom errors.

#### #isBlacklisted(setName, id)
```
var limiter = require('api-limiter').connect([poolRedisPromiseConfig]);

limiter.isBlacklisted('blacklist', 'ABC-123')
  .then(function(isBlacklisted) {
    // logic
  });
```

**Arguments**

1. setName *(String)*: the name of the blacklist to check, which is a set in Redis
2. id *(String)*: the id to check

**Returns**

A promise that resolves with a boolean indicating whether the given id was found in the given set

#### #blacklist(setName, ids)
```
var limiter = require('api-limiter').connect([poolRedisPromiseConfig]);

limiter.blacklist('blacklist', ['ABC-123', 'XYZ-789'])
  .then(function(count) {
    // logic
  });
```

**Arguments**

1. setName *(String)*: the name of the blacklist to update
2. ids *(Array < String >)*: the id(s) to add to the blacklist set

**Returns**

A promise that resolves with an integer representing the number of ids added to the blacklist (NOTE: members of a set must be unique, therefore duplicate ids will be ignored)

#### #TooManyRequestsError()
```
var limiter = require('api-limiter').connect([poolRedisPromiseConfig]);

var limiterInstance = limiter.create([consumerConfig]);

limiterInstance.consume('ABC-123')
  .then(function(consumer) {
    if (!consumer.allowed) {
      Bluebird.reject(new limiter.TooManyRequestsError());
    }
  })
  .then(...)
  .catch(limiter.TooManyRequestsError, function(err) {
    // handle error
  });
```

A custom error which can be rejected and specifically caught (via a promise API like [Bluebird's](https://github.com/petkaantonov/bluebird/blob/master/API.md#catchfunction-errorclassfunction-predicate-function-handler---promise)) when a consumer's key has exceed the limit over the given interval.

#### #BlacklistedError()
```
var limiter = require('api-limiter').connect([poolRedisPromiseConfig]);

limiter.isBlacklisted('blacklist', 'ABC-123')
  .then(function(isBlacklisted) {
    if (isBlacklisted) {
      Bluebird.reject(new limiter.BlacklistedError());
    }
  })
  .then(...)
  .catch(limiter.BlacklistedError, function(err){
    // handle error
  });
```

A custom error which can be rejected and specifically caught (via a promise API like [Bluebird's](https://github.com/petkaantonov/bluebird/blob/master/API.md#catchfunction-errorclassfunction-predicate-function-handler---promise)) when a consumer's key is blacklisted for a given set.

#### #create(consumerConfig)
```
var limiter = require('api-limiter').connect([poolRedisPromiseConfig]);

var limiterInstance = limiter.create([consumerConfig]);
```

Creates a new instance of an API-Limiter consumer, which can be used to increment usage of a given resource for a given key (e.g., user ID, IP Address), and return triggers that can be used to block usage of a given resource if the request threshold is met over the given time interval.

**Arguments**

1. [consumerConfig] *(Object)*: *Optional* Configuration for the limiter which includes:
* limit *(Integer)*: the maximum number of requests for a resource that can be made over the given interval
* interval *(Integer)*: the time interval (in seconds) that the limited number of requests for a resource can be made, which resets once it expires regardless of whether the limit was exceeded or not
* namespace *(String)*: namespace for the keys, which enables multiple limiters across the same set of keys (useful if you want to limit usage for a given key in a variety of ways, for instance over 10 seconds, 10 minutes, 1 hour, and 1 day)

**Returns**

An instance of an API-Limiter consumer.

##### #consume(id)
```
var limiter = require('api-limiter').connect([poolRedisPromiseConfig]);

var limiterInstance = limiter.create([consumerConfig]);

limiterInstance.consume('ABC-123')
  .then(function(consumer) {
    if (!consumer.allowed) {
      Bluebird.reject(new limiter.TooManyRequestsError());
    }
  })
  .then(...)
  .catch(...);
```

For the given id, increment the usage by 1. If this is the first request by the consumer, it sets usage to 1.

**Arguments**

1. id *(String)*: the id to increment usage of over the given interval for the limiter instance

**Returns**

A consumer object for the given id including:
* id *(String)*: the identifer for the consumer
* usage *(Integer)*: the number of requests made by the consumer over the given interval
* limit *(Integer)*: the number of requests allowed to be made by a consumer of the given interval (as established by the configuration passed when creating the limiter instance)
* interval *(Integer)*: the time interval (in seconds) over which usage is being limited (as established by the configuration passed when creating the limiter instance)
* allowed *(Boolean)*: true/false as to whether usage has exceeded the limit over the time interval

##### #query(id)
```
var limiter = require('api-limiter').connect([poolRedisPromiseConfig]);

var limiterInstance = limiter.create([consumerConfig]);

limiterInstance.query('ABC-123')
  .then(function(consumer) {
    if (!consumer.allowed) {
      Bluebird.reject(new limiter.TooManyRequestsError());
    }
  })
  .then(...)
  .catch(...);
```

For the given id, fetch the associated consumer object

**Arguments**

1. id *(String)*: the id check usage of

**Returns**

A consumer object for the given id including:
* id *(String)*: the identifer for the consumer
* usage *(Integer)*: the number of requests made by the consumer over the given interval
* limit *(Integer)*: the number of requests allowed to be made by a consumer of the given interval (as established by the configuration passed when creating the limiter instance)
* interval *(Integer)*: the time interval (in seconds) over which usage is being limited (as established by the configuration passed when creating the limiter instance)
* allowed *(Boolean)*: true/false as to whether usage has exceeded the limit over the time interval

## Testing

Tests can be run via `npm test`. Ensure that an instance of Redis is running for the integration tests.