var assert = require('assert')
  , should = require('should')
  , mongoose = require('mongoose');


process.env.NODE_ENV = 'test';



/**
 * Simple expresso tests for the AppController
 */
require('../app').boot(function(server) {
  app = server;
  
  module.exports = {
    'Get the home page and confirm a 200' : function(beforeExit) {
      assert.response(app, { url: '/', method: 'GET'}, function(res) {
        res.statusCode.should.equal(200)
        beforeExit()
      })
    },
    
    'Get an invalid page as an anonymous user and get a 404': function(beforeExit) {
      assert.response(app, { url: '/this-is-an-invalid-page', method: 'GET'}, function(res) {
        res.statusCode.should.equal(404)
        beforeExit()
      })
    },
    
    tearDown: function(beforeExit){
      beforeExit(process.exit())
    }
  }
})