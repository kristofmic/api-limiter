describe('consumer', function () {
  var
    Bluebird = require('bluebird'),
    redisClientStub,
    clientStub,
    Consumer;

  beforeEach(function () {
    clientStub = {
      hgetAsync: sinon.stub(),
      hincrbyAsync: sinon.stub(),
      expireAsync: sinon.stub(),
      delAsync: sinon.stub()
    };

    redisClientStub = {
      getClientAsync: function(cb) {
        return cb(clientStub);
      }
    };

    Consumer = require('../../../dist/limiter/consumer');
  });

  describe('constructor', function () {
    it('should set the limit, interval and namespace', function() {
      var
        c = new Consumer(redisClientStub, {limit: 10, interval: 100, namespace: 'foobar'});

      expect(c.limit).to.equal(10);
      expect(c.interval).to.equal(100);
      expect(c.namespace).to.equal('foobar');
      expect(c.redisClientPool).to.equal(redisClientStub);
    });
  });

  describe('query()', function () {
    var
      c;

    beforeEach(function() {
      clientStub.hgetAsync.returns(Bluebird.resolve('6'));

      c = new Consumer(redisClientStub, {limit: 10, interval: 100, namespace: 'foobar'});
    });

    it('should query for the usage value and return the full consumer', function(done) {
      c.query('uid')
        .then(function(consumer) {
          expect(consumer).to.eql({
            id: 'uid',
            usage: 6,
            limit: 10,
            interval: 100,
            allowed: true
          });
          done();
        });
    });
  });

  describe('clear()', function () {
    var
      c;

    beforeEach(function() {
      clientStub.delAsync.returns(Bluebird.resolve(1));

      c = new Consumer(redisClientStub, {limit: 10, interval: 100, namespace: 'foobar'});
    });

    it('should remove the consumer from redis', function(done) {
      c.clear('uid')
        .then(function(res) {
          expect(res).to.equal(1);
          done();
        });
    });
  });

  describe('consume()', function () {
    var
      c;

    beforeEach(function() {
      c = new Consumer(redisClientStub, {limit: 10});
    });

    it('should increment the usage value by 1 for the id and return the consumer', function(done) {
      clientStub.hincrbyAsync.returns(Bluebird.resolve(2));

      c.consume('uid')
        .then(function(consumer) {
          expect(consumer).to.eql({
            id: 'uid',
            usage: 2,
            limit: 10,
            interval: 1,
            allowed: true
          });

          expect(clientStub.expireAsync).to.not.have.been.called;
          done();
        });
    });

    it('should increment the usage value by 1 for the id and return the consumer and set a TTL if the usage is only 1', function(done) {
      clientStub.hincrbyAsync.returns(Bluebird.resolve(1));
      clientStub.expireAsync.returns(Bluebird.resolve(1));

      c.consume('uid')
        .then(function(consumer) {
          expect(consumer).to.eql({
            id: 'uid',
            usage: 1,
            limit: 10,
            interval: 1,
            allowed: true
          });

          expect(clientStub.expireAsync).to.have.been.calledWith('limiter:uid', 1);
          done();
        });
    });
  });
});