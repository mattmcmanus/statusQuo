var assert = require('assert')
  , should = require('should')
  , mongoose = require('mongoose');


/**
 * Simple expresso tests for the AppController
 */
require('../app').boot(function(server) {
  app = server;
  
  module.exports = {
    'Get the home page and confirm a 200' : function() {
      assert.response(app, { url: '/', method: 'GET'}, function(res) {
        res.statusCode.should.equal(200)
      })
    },
    
    'Get an invalid page as an anonymous user and get a 404': function() {
      assert.response(app, { url: '/this-is-an-invalid-page', method: 'GET'}, function(res) {
        res.statusCode.should.equal(404)
      })
    },
    
    'Get the create server page as an anonymous user and get a forbidden': function() {
      assert.response(app, { url: '/server/new', method: 'GET'}, function(res) {
        res.statusCode.should.equal(403)
      })
    },
    
    'Get the server lookup page as an anonymous user and get a 200': function() {
      assert.response(app, { url: '/server/lookup/127.0.0.1', method: 'GET'}, function(res) {
        res.statusCode.should.equal(200)
      })
    }
  }
});

// Since the tests don't seem to stop on their own...
setTimeout(function(){
  process.exit()
}, 5000);
