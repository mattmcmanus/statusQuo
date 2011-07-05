var assert = require('assert')
  , should = require('should')
  , mongoose = require('mongoose');


/**
 * Simple expresso tests for the AppController
 */
require('../app').boot(function(server) {
  app = server;
  
  module.exports = {
    'Get the home page and confirm a 200' : function(beforeExit) {
      assert.response(app, { url: '/', method: 'GET'}, function(res) {
        res.statusCode.should.equal(200)
        beforeExit(function(){});
      })
    },
    
    'Get an invalid page as an anonymous user and get a 404': function(beforeExit) {
      assert.response(app, { url: '/this-is-an-invalid-page', method: 'GET'}, function(res) {
        res.statusCode.should.equal(404)
        beforeExit(function(){});
      })
    },
    
    'Get the create server page as an anonymous user and get a forbidden': function(beforeExit) {
      assert.response(app, { url: '/server/new', method: 'GET'}, function(res) {
        res.statusCode.should.equal(403)
        beforeExit(function(){});
      })
    }
  }
});
  
setTimeout(function(){
  process.exit()
}, 5000);
