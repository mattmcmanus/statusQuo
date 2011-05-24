var sq = require('../lib/statusquo')
  , _ = require('underscore')
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
  function removeThe(w) {
    return (w.indexOf("the ") !== -1)? w.substr(4) : w
  }
  function sortServers(s1, s2) {
    var x = removeThe(s1["name"].toLowerCase())
    var y = removeThe(s2["name"].toLowerCase())
    return ((x < y) ? -1 : ((x > y) ? 1 : 0))
  }
  
  app.get('/', function(req, res){
    var find = {}
    if (req.session.auth && req.session.auth.loggedIn) {
      app.Server.find({user : req.session.auth.userId}).sort('name', 1 ).run(function (err, servers) {
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
    } else {
      app.Server.find({ 'services.public' : true }).run(function (err, servers) {
        var publicServices = []
        _.each(servers, function(server){
          publicServices.push(_.select(server.services, function(service){ return service.public == true}))
        })
        publicServices = _.flatten(publicServices)
        publicServices = publicServices.sort(sortServers)
        res.render('service', {
          title: "Dashboard",
          services: publicServices
        })
      })
    }
    
  });
  
  app.get('/server/new', sq.isAuthenticated, function(req, res){
    sq.debug(req.loggedIn, "Logged in")
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
      , user    : req.session.auth.userId
    })
    
    for (var i=0; i < _.size(req.body.server.services); i++) {
      delete req.body.server.services[i]['delete']
      server.services.push(req.body.server.services[i])
    }
    
    server.save(function(err){
      if (!err) {
        req.flash('success', 'You\'re server has been created')
        serverCheck(server)
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
    
  app.get('/server/:server/edit', sq.isAuthenticated, function(req, res){
    res.render('server/edit', {server: req.server})
  });
  
  app.put('/server/:server', function(req, res, next){
    if(!req.server) return next(new Error('That server disappeared!'))
    
    sq.debug(req.server.toObject(),  "Server Pre")
    
    req.server.updated = new Date();
    req.server.ip = req.body.server.ip
    req.server.name = req.body.server.name
    req.server.os = req.body.server.os
    req.server.type = req.body.server.type
    
    for (var num = _.size(req.body.server.services) - 1; num >= 0; num--){
      if (req.server.services[num]) {
        if (req.body.server.services[num].delete == "true") {
          req.server.services[num].remove()
        } else {
          req.server.services[num].type = req.body.server.services[num].type
          req.server.services[num].name = req.body.server.services[num].name
          req.server.services[num].url = req.body.server.services[num].url
          req.server.services[num].public = (req.body.server.services[num].public)?true:false
        }
      } else {
        // Defer adding new services until the loop finishes
        delete req.body.server.services[num]["delete"]
        req.server.services.push(req.body.server.services[num]);
      }
    }
    sq.debug(req.server.toObject(),  "Server Post")
    req.server.save(function(err){
      if (!err) {
        req.flash('success', 'Server updated')
        serverCheck(req.server)
      } else {
        req.flash('error', 'The changes to your sever could not be made because '+err.message)
        sq.debug(err, "Server Put Error")
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
        sq.debug(err, "Server Delete Error")
      }
      res.redirect('/')
    });
  });
  
  app.get('/tag/:tag', sq.isAuthenticated, function(req, res){
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
    sq.lib.request({uri:service.url, onResponse:true}, function (error, response, body) {
      if (error) {
        var response = {}
        response.statusCode = 500
      }
      var serviceResponse = new app.ServiceResponse({
          serviceID       :  service._id
        , type            :  service.type
        , responseStatus  :  responseStatus(response.statusCode)
        , responseCode    :  response.statusCode
        , responseMessage :  (error)?error.message.substr(error.message.indexOf(',')+2):HTTPStatus[response.statusCode]
      })
      fn(null, serviceResponse)
    })
  }
  
  function serverCheck(server) {
    sq.lib.async.map(server.services, serviceCheck, function(err, serviceResponses){
      _.each(serviceResponses, function(serviceResponse, key){
        serviceResponse.serverID = server._id
        // Update the lastStatus value for the service for easy access later. Also, put ok to uppercase....cause it lookes nicer
        server.services[key].lastStatus = (serviceResponse.responseStatus === 'ok')?'OK':serviceResponse.responseStatus;
        server.services[key].lastStatusTime = new Date()
        serviceResponse.save(function(err){
          if (err) {
            new Error('Couldnt save the serviceResponse')
            console.log(err)
          } 
        });
      })
      server.save(function(err){
        if (err) {
          new Error('Updated server')
          console.log(err)
        }
      });
    })
  }
  
  app.get('/check?', function(req, res){ //4dbb1ef58797f3e47f000001
    app.Server.find({user:req.query.user}, function(err, servers){
      _.each(servers, function(server){
        serverCheck(server)
      })
      res.send()
    })
    
    
  })
  
  app.get('/server/:server/check', function(req, res){
    serverCheck(req.server)
  })
  
  app.get('/server/:server/status', function(req, res){
    var result = {
        ok: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'OK' }))
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