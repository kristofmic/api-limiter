describe('connect', function () {
  var
    proxyquire = require('proxyquire'),
    Bluebird = require('bluebird'),
    poolRedisStub,
    clientStub,
    redisClientStub,
    consumerStub,
    connect;

  beforeEach(function() {
    clientStub = {
      sismemberAsync: sinon.stub(),
      saddAsync: sinon.stub(),
      hgetAsync: sinon.stub(),
      hincrbyAsync: sinon.stub(),
      expireAsync: sinon.stub()
    };

    redisClientStub = {
      getClientAsync: function(cb) {
        return cb(clientStub);
      }
    };

    poolRedisStub = function() {
      return redisClientStub;
    };

    consumerStub = sinon.spy();

    connect = proxyquire('../../../dist/limiter/connect', {
      'pool-redis-promise': poolRedisStub,
      './consumer': consumerStub
    });
  });

  describe('connect()', function () {
    it('should return a new limiter object', function() {
      var
        limiter = connect.connect();

      expect(typeof limiter.create).to.equal('function');
      expect(typeof limiter.isBlacklisted).to.equal('function');
      expect(limiter.TooManyRequestsError.prototype instanceof Error).to.be.true;
      expect(limiter.BlacklistedError.prototype instanceof Error).to.be.true;
    });
  });

  describe('limiter.create()', function () {
    var
      limiter;

    beforeEach(function () {
      limiter = connect.connect();
    });

    it('should return a new Consumer instance', function () {
      limiter.create('config');

      expect(consumerStub.calledWithNew()).to.be.true;
      expect(consumerStub).to.have.been.calledWith(redisClientStub, 'config');
    });
  });

  describe('limiter.isBlacklisted()', function () {
    var
      limiter;

    beforeEach(function () {
      limiter = connect.connect();

      clientStub.sismemberAsync.returns(Bluebird.resolve(1));
    });

    it('should check if the id is a member of the blacklist set', function(done) {
      limiter.isBlacklisted('set', 'id')
        .then(function(res) {
          expect(clientStub.sismemberAsync).to.have.been.calledWith('set', 'id');
          expect(res).to.be.true;

          done();
        });
    });
  });

  describe('limiter.blacklist()', function () {
    var
      limiter;

    beforeEach(function () {
      limiter = connect.connect();
    });

    it('should add the id as a member of the blacklist set', function(done) {
      clientStub.saddAsync.returns(Bluebird.resolve(1));

      limiter.blacklist('set', ['id'])
        .then(function(res) {
          expect(res).to.equal(1);

          done();
        });
    });

    it('should add the ids as members of the blacklist set', function(done) {
      clientStub.saddAsync.returns(Bluebird.resolve(2));

      limiter.blacklist('set', ['id', 'id2'])
        .then(function(res) {
          expect(res).to.equal(2);

          done();
        });
    });
  });
});







