'use strict';

var Lab = require('lab');
var should = require('should');
var Completer = require('../lib/index');
var redis = require('redis');
var async = require('async');

var describe = Lab.experiment;
var it = Lab.test;
var before = Lab.before;
var after = Lab.after;

var completer = null;
var redisConn = redis.createClient();

describe('Completer', function () {
  after(function (done) {
    redisConn.keys('autocomplete*', function (err, keys) {
      if (err) {
        throw err;
      } else {
        async.each(keys, function (key, cb) {
          redisConn.del(key, cb);
        }, function (err) {
          if (err) {
            throw err;
          } else {
            done();
          }
        });
      }
    });
  });
  
  it('should exist and be able to initialize', function (done) {
    should.exist(Completer);
    completer = new Completer();
    should.exist(completer);
    done();
  });
  
  it('should be able to create an index of documents', function (done) {
    var data = [{ id: 1, name: 'Peter Henning' }, { id: 2, name: 'Grant Koeneke'}, { id: 3, name: 'Peter Chapman' }, { id: 4, name: 'Andrew Burgess' }];
    completer.index({data: data}, function (err) {
      if (err) {
        throw err;
      } else {
        redisConn.keys('autocomplete:items:compl:*', function (err, data) {
          if (err) {
            throw err;
          } else {
            should.exist(data);
            data.should.be.an.instanceOf(Array);
            data.length.should.not.equal(0);
            redisConn.hgetall('autocomplete:items:docs', function (err, item) {
              if (err) {
                throw err;
              } else {
                should.exist(item);
                item.should.have.keys('1', '2', '3', '4');
                JSON.parse(item['1']).name.should.equal('Peter Henning');
                JSON.parse(item['2']).name.should.equal('Grant Koeneke');
                JSON.parse(item['3']).name.should.equal('Peter Chapman');
                JSON.parse(item['4']).name.should.equal('Andrew Burgess');
                done();
              }
            });
          }
        });
      }
    });
  });
  
  it('should be able to autocomplete a simple one word search for one document', function (done) {
    var search = 'gran';
    
    completer.search({ search: search }, function (err, items) {
      if (err) {
        throw err;
      } else {
        should.exist(items);
        items.should.be.an.instanceOf(Array);
        items.length.should.equal(1);
        items[0].should.have.keys('id', 'name');
        items[0].id.should.equal(2);
        items[0].name.should.equal('Grant Koeneke');
        done();
      }
    });
  });
  
  it('should be able to autocomplete a simple uppercased word search for one document', function (done) {
    var search = 'GRan';
    
    completer.search({ search: search }, function (err, items) {
      if (err) {
        throw err;
      } else {
        should.exist(items);
        items.should.be.an.instanceOf(Array);
        items.length.should.equal(1);
        items[0].should.have.keys('id', 'name');
        items[0].id.should.equal(2);
        items[0].name.should.equal('Grant Koeneke');
        done();
      }
    });
  });
  
  it('should be able to autocomplete a simple uppercased word from the second word for one document', function (done) {
    var search = 'koe';
    
    completer.search({ search: search }, function (err, items) {
      if (err) {
        throw err;
      } else {
        should.exist(items);
        items.should.be.an.instanceOf(Array);
        items.length.should.equal(1);
        items[0].should.have.keys('id', 'name');
        items[0].id.should.equal(2);
        items[0].name.should.equal('Grant Koeneke');
        done();
      }
    });
  });
  
  it('should be able to autocomplete a simple uppercased word search for two documents', function (done) {
    var search = 'pet';
    
    completer.search({ search: search }, function (err, items) {
      if (err) {
        throw err;
      } else {
        should.exist(items);
        items.should.be.an.instanceOf(Array);
        items.length.should.equal(2);
        var name1 = items[0].name;
        var name2 = items[1].name;
        var inOrder = (name1 < name2);
        inOrder.should.equal(true);
        done();
      }
    });
  });
  
  
});