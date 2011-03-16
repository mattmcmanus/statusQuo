var global = require('./global');
require('../lib/underscore.js')

module.exports = function(app){
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
  
  app.get('/server/new', function(req, res){
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
        console.log(err)
      }
      res.redirect('/')
    });
  });
  
  app.param('server', function(req, res, next, id){
    app.Server.findOne({_id: id}, function(err, server) {
      if (err) return next(err);
      if (!server) return next(new Error('failed to find server'));
      req.server = server;
      next();
    });
  });
  
  app.get('/server/:server', function(req, res){
    res.render('server/show', {server: req.server});
  });
  
  app.get('/server/:server/edit', function(req, res){
    res.render('server/edit', {server: req.server});
  });
  
  app.put('/server/:server', function(req, res, next){
    app.Server.findOne({_id: req.params.id}, function(err, server) {
      if(!server) return next(new NotFound('That server disappeared!'));
      
      delete req.body.server.services.index;
      server.updated = new Date();
      server.ip = req.body.server.ip;
      server.name = req.body.server.name;
      server.os = req.body.server.os;
      
      for (var num = _.size(req.body.server.services) - 1; num >= 0; num--){
        if (server.services[num]) {
          if (req.body.server.services[num].delete == "true") {
            server.services[num].remove()
          } else {
            server.services[num].name = req.body.server.services[num].name
            server.services[num].url = req.body.server.services[num].url
            server.services[num].port = req.body.server.services[num].port
          }
        } else {
          // Defer adding new services until the loop finishes
          delete req.body.server.services[num]["delete"]
          server.services.push(req.body.server.services[num]);
        }
      }
      console.log(server.toObject())
      server.save(function(err){
        if (!err) {
          req.flash('success', 'Server updated')
        } else {
          req.flash('error', 'Err, Something broke when we tried to save your server. Sorry!')
          console.log(err)
        }
        res.redirect('/')
      });
    })
  });
  
  app.del('/server/:id', function(req, res, next){
    app.Server.findOne({_id: req.params.id}, function(err, server) {
      if(!server) return next(new NotFound('That server disappeared!'));
      
      server.remove(function(err){
      if (!err) {
        req.flash('success', 'Server removed')
      } else {
        req.flash('error', 'Err, Something broke when we tried to delete your server. Sorry!')
        console.log(err)
      }
      res.redirect('/')
    });
    })
  });
};