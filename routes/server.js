var global = require('./global')
  , _ = require('underscore')
  , dns = require('dns')
  , request = require('request')
  , util   = require('util')
  , async = require('async')
  , spawn = require('child_process').spawn
  , info = [];

module.exports = function(app){
  //                      PARAMETERS
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  app.param('server', function(req, res, next, id){
    app.Server.findOne({_id: id}, function(err, server) {
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
    if (req.session.user) {
      app.Server.find({user: req.session.user.id}, function(err, servers){
        res.render('server/index', {
          title: "Dashboard",
          servers: servers
        })
      })
    } else {
      app.Server.find({public: true}, function(err, servers){
        res.render('server/index', {
          title: "Dashboard",
          servers: servers
        })
      })
    }
    
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
      , public  : (req.body.server.public)?true:false
      , user : req.session.user.id
    });
    
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
    if (req.params.format === 'json')
      res.send(req.server.toObject());
    else if (req.xhr)
      res.partial('server/show', {server: req.server});
    else
      res.render('server/show', {server: req.server});
  });
    
  app.get('/server/:server/edit', global.isAuthenticated, function(req, res){
    res.render('server/edit', {server: req.server});
  });
  
  app.put('/server/:server', function(req, res, next){
    if(!req.server) return next(new Error('That server disappeared!'));
    var server = req.server
      , services = server.services;
    
    server.updated = new Date();
    server.ip = req.body.server.ip;
    server.name = req.body.server.name;
    server.os = req.body.server.os;
    server.public  = (req.body.server.public)?true:false
    for (var num = _.size(req.body.server.services) - 1; num >= 0; num--){
      if (services[num]) {
        if (req.body.server.services[num].delete == "true") {
          server.services.splice(num,1)
        } else {
          services[num].name = req.body.server.services[num].name
          services[num].url = req.body.server.services[num].url
          services[num].port = req.body.server.services[num].port
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
  
  
  //                      Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function statusObject(id, statusCode, err) {
    var status, message;
    switch(statusCode) {
      case 302: status = "warning"; message = "Redirected"; break;
      case 403: status = "error"; message = "Forbidden"; break;
      case 500: status = "error"; message = (err)?err.message.substr(err.message.indexOf(',')+2):'BROKEN'; break;
      default: status = "ok"; message = "OK"
    }
    return { id:id, status:status, statusCode: statusCode, message: message };
  }
  
  function serviceCheck (service, fn) {
    var options = require('url').parse(service.url);
    
    request({uri:service.url, onResponse:true}, function (error, response, body) {
      if (error) {
        console.log(service.url + ": " + error.message)
        fn(null, statusObject( service._id, 500, error ));
      } else {
        //console.log(service.url + ": " + response.statusCode)
        //console.log(body)
        fn(null, statusObject( service._id, response.statusCode ));
      }
    })
    
    //if (options.protocol === 'https:'){
    //  https.get(options, function(get){
    //    fn(null, statusObject( service._id, get.statusCode ));
    //  }).on('error', function(e) {
    //    fn(null, statusObject( service._id, 500, e ));
    //  })
    //} else {
    //  http.get(options, function(get){
    //    fn(null, statusObject( service._id, get.statusCode ));
    //  }).on('error', function(e) {
    //    fn(null, statusObject( service._id, 500, e ));
    //  })
    //}
  }
  
  app.get('/server/:server/check', function(req, res){
    async.map(req.server.services, serviceCheck, function(err, results){
      if (err) console.log(err)
      var result = {
          ok: _.select(results, function(service){return service.status == 'ok' })
        , warning: _.select(results, function(service){return service.status == 'warning' })
        , error: _.select(results, function(service){return service.status == 'error' })
      }
      
      res.send(result)
    });
  })
  
  
  app.get('/server/:server/service/:service', function(req, res){
    serviceCheck(req.service, function(err, result){
      res.send(result)
    })
  })
};