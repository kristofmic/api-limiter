class Consumer {
  constructor(redisClientPool, { limit = 0, interval = 1, namespace = 'limiter' }) {
    this.limit = limit;
    this.interval = interval; // seconds
    this.namespace = namespace;
    this.redisClientPool = redisClientPool;
  }

  consume(id) {
    var
      self = this;

    return self.redisClientPool.getClientAsync(exec);

    function exec(client) {
      return client.hincrbyAsync(`${self.namespace}:${id}`, 'usage', 1)
        .then(checkUsage)
        .then(_returnConsumer.bind(self, id));

      function checkUsage(usage) {
        if (usage > 1) { return usage; }

        // this is a new consumer so we need to set the expiration on the record
        return client.expireAsync(`${self.namespace}:${id}`, self.interval)
          .return(usage);
      }
    }
  }

  query(id) {
    var
      self = this;

    return self.redisClientPool.getClientAsync(exec);

    function exec(client) {
      return client.hgetAsync(`${self.namespace}:${id}`, 'usage')
        .then(_returnConsumer.bind(self, id));
    }
  }
}

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