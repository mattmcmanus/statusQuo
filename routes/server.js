var global = require('./global')
  , _ = require('underscore')
  , dns = require('dns')
  , request = require('request')
  , util   = require('util')
  , async = require('async')
  , spawn = require('child_process').spawn
  , HTTPStatus = require('http-status')
  , info = [];

module.exports = function(app){
  
  //                      PARAMETERS
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  app.param('server', function(req, res, next, id){
    app.Server.findById(id, function(err, server) {
      if (err) return next(err);
      if (!server) return next(new Error('failed to find server'));
      req.server = server;
      next();
    });
  });
  
  app.param('service', function(req, res, next, id){
    if (req.server) {
      req.service = req.server.services.id(id)
    }
    next();
  });
  
  //                      Routes
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  app.get('/', function(req, res){
    var find = {}
    if (req.session.user)
      find.user = req.session.user._id
    else
      find.public = true
    
    app.Server.find(find).sort('name', 1 ).run(function (err, servers) {
      var list = {}
          list.production = _.select(servers, function(server){ return _.include(server.type, "production") })
        , list.development = _.select(servers, function(server){ return _.include(server.type, "development") })
        , list.other = _.reject(servers, function(server){
                          return _.any(server.type, function(type){
                                    return (type == "development" || type == "production")
                          })
                      })
      res.render('server/index', {
        title: "Dashboard",
        servers: list
      })
    })
  });
  
  app.get('/server/new', global.isAuthenticated, function(req, res){
    res.render('server/new', {
      server: new app.Server()
    });
  });
  
  app.post('/server/new', function(req, res){
    var server = new app.Server({
        name    : req.body.server.name
      , type    : req.body.server.type
      , ip      : req.body.server.ip
      , os      : req.body.server.os
      , user    : req.session.user._id
    })
    
    for (var i=0; i < _.size(req.body.server.services); i++) {
      delete req.body.server.services[i]['delete']
      server.services.push(req.body.server.services[i])
    }
    
    server.save(function(err){
      if (!err) {
        req.flash('success', 'You\'re server has been created')
      } else {
        req.flash('error', 'Err, Something broke when we tried to save your server. Sorry!')
        console.log("Mongoose ERROR:" + err)
      }
      res.redirect('/')
    });
  });
  
  app.get('/server/lookup/:ip', function(req, res){
    dns.reverse(req.params.ip, function(err, domains){
      if (err) domains = []
      res.send(domains)
    })
  });
  
  app.get('/server/:server.:format?', function(req, res){
    _.each(req.server.type, function(type, key){ req.server.type[key] = '<span class="type '+type+'">'+type+'</span>' })
    req.server.type = req.server.type.join('')
    
    if (req.params.format === 'json')
      res.send(req.server.toObject())
    else if (req.xhr)
      res.partial('server/show', {server: req.server})
    else
      res.render('server/show', {server: req.server})
  }); 
    
  app.get('/server/:server/edit', global.isAuthenticated, function(req, res){
    res.render('server/edit', {server: req.server})
  });
  
  app.put('/server/:server', function(req, res, next){
    if(!req.server) return next(new Error('That server disappeared!'))
    var server = req.server
      , services = server.services;
    
    server.updated = new Date();
    server.ip = req.body.server.ip
    server.name = req.body.server.name
    server.os = req.body.server.os
    server.type = req.body.server.type
    
    for (var num = _.size(req.body.server.services) - 1; num >= 0; num--){
      if (services[num]) {
        if (req.body.server.services[num].delete == "true") {
          server.services.splice(num,1)
        } else {
          services[num].type = req.body.server.services[num].type
          services[num].name = req.body.server.services[num].name
          services[num].url = req.body.server.services[num].url
          services[num].public = (req.body.server.services[num].public)?true:false
        }
      } else {
        // Defer adding new services until the loop finishes
        delete req.body.server.services[num]["delete"]
        services.push(req.body.server.services[num]);
      }
    }
    server.services = services;
    server.save(function(err){
      if (!err) {
        req.flash('success', 'Server updated')
      } else {
        req.flash('error', 'Err, Something broke when we tried to save your server. Sorry!')
        console.log("ERROR:" + err)
      }
      res.redirect('/')
    });
  });
  
  app.del('/server/:server', function(req, res, next){
    if(!req.server) return next(new NotFound('That server disappeared!'));
    
    req.server.remove(function(err){
      if (!err) {
        req.flash('success', 'Server removed')
      } else {
        req.flash('error', 'Err, Something broke when we tried to delete your server. Sorry!')
        console.log("ERROR:" + err)
      }
      res.redirect('/')
    });
  });
  
  app.get('/tag/:tag', global.isAuthenticated, function(req, res){
    app.Server.find({}, {type:1}, function(err, servers) {
      if (err) return next(err);
      var tags = _.select(_.uniq(_.flatten(_.pluck(servers,'type')).sort(), true), function(word){
        return (word.indexOf(req.params.tag) != -1)?true:false
      })
      res.send(tags)
    });
  });
  
  //                      Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function responseStatus(statusCode) {
    if (statusCode >= 300 && statusCode < 400) 
      return "warning"
    else if (statusCode >= 400) 
     return "error"
    else 
      return "ok"
  }
  
  function serviceCheck (service, fn) {
    request({uri:service.url, onResponse:true}, function (error, response, body) {
      if (error) response.statusCode = 500
      var serviceResponse = new app.ServiceResponse({
          serviceID       :  service._id
        , timestamp       :  new Date()
        , type            :  service.type
        , responseStatus  :  responseStatus(response.statusCode)
        , responseCode    :  response.statusCode
        , responseMessage :  (error)?error.message.substr(err.message.indexOf(',')+2):HTTPStatus[response.statusCode]
      })
      fn(null, serviceResponse)
    })
  }
  
  app.get('/server/:server/check', function(req, res){
    async.map(req.server.services, serviceCheck, function(err, serviceResponses){
      _.each(serviceResponses, function(serviceResponse, key){
        serviceResponse.serverID = req.server._id
        req.server.services[key].lastStatus = serviceResponse.responseStatus
        serviceResponse.save(function(err){
          if (err) {
            new Error('Couldnt save the serviceResponse')
            console.log(err)
          } 
        });
      })
      req.server.save(function(err){
        if (err) {
          new Error('Updated server')
          console.log(err)
        }
      });
      
    })
  })
  
  app.get('/server/:server/status', function(req, res){
    var result = {
        ok: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'ok' }))
      , warning: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'warning' }))
      , error: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'error' }))
    }
    res.send(result)
  });
  
  
  app.get('/server/:server/service/:service', function(req, res){
    serviceCheck(req.service, function(err, result){
      res.send(result)
    })
  })
};