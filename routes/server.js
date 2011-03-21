require('../lib/underscore.js')

var global = require('./global')
  , dns = require('dns')
  , http = require('http')
  , https = require('https')
  , util   = require('util')
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
      app.Server.find({user_id: req.session.user.id}, function(err, servers){
        res.render('server/index', {
          title: "Dashboard",
          servers: servers
        })
      })
    } else {
      res.render('page', {
        title: "Status Quo",
        body: "You need to login before you can see any hotness"
      })
    }
    
  });
  
  app.get('/server/new', global.isAuthenticated, function(req, res){
    res.render('server/new', {
      server: new app.Server()
    });
  });
  
  app.post('/server/new', function(req, res){
    // Clean up some of the stuff coming in from the form
    delete req.body.server.services.index;
    
    var server = new app.Server({
        name    : req.body.server.name
      , type    : req.body.server.type
      , ip      : req.body.server.ip
      , os      : req.body.server.os
      , public  : (req.body.server.public)?true:false
      , user_id : req.session.user.id
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
  
  app.get('/server/:server', function(req, res){
    res.render('server/show', {server: req.server});
  });
  
  app.get('/server/:server/edit', global.isAuthenticated, function(req, res){
    res.render('server/edit', {server: req.server});
  });
  
  app.put('/server/:server', function(req, res, next){
    if(!req.server) return next(new Error('That server disappeared!'));
    var server = req.server
      , services = server.services;
    
    delete req.body.server.services.index;
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
    console.log(server.services.toObject())
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
  
  function statusMessage(statusCode) {
    var message;
    switch(statusCode) {
      case 302: message = "Redirected";break;
      case 403: message = "Forbidden";break;
      default: message = "OK"
    }
    return message;
  }
  
  app.get('/server/:server/service/:service', function(req, res){
    var options = require('url').parse(req.service.url);
    if (options.protocol === 'https:') {
      https.get(options, function(get){
        console.log(get.headers);
        get.on('data', function (chunk) {
          console.log('BODY: ' + chunk);
        });
        res.send({statusCode: get.statusCode, message: statusMessage(get.statusCode)});
      }).on('error', function(e) {
        res.send({statusCode: 500, message: e.message.substr(e.message.indexOf(',')+2)});
      })
    } else {
      http.get(options, function(get){
        res.send({statusCode: get.statusCode, message: statusMessage(get.statusCode)});
      }).on('error', function(e) {
        res.send({statusCode: 500, message: e.message.substr(e.message.indexOf(',')+2)});
      })
    }
  })
};