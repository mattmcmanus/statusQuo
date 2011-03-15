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
    var server = new app.Server(req.body.server);
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
  
  app.get('/server/:id', function(req, res){
    app.Server.findOne({_id: req.params.id}, function(err, server) {
      res.render('server/show', {server: server});
    })
  });
  
  app.get('/server/:id/edit', function(req, res){
    app.Server.findOne({_id: req.params.id}, function(err, server) {
      res.render('server/edit', {server: server});
    })
  });
  
  app.put('/server/:id', function(req, res, next){
    app.Server.findOne({_id: req.params.id}, function(err, server) {
      console.log(server.toObject());
      if(!server) return next(new NotFound('That server disappeared!'));
      server.updated = Date.now;
      server.ip = req.body.server.ip;
      server.name = req.body.server.hostname;
      server.os = req.body.server.os;
      
      var push = [];
      
      for (var num = _.size(req.body.server.services) - 1; num >= 0; num--){
        if (server.services[num]) {
          if (req.body.server.services[num].delete == "true") {
            server.services[num].remove()
          } else {
            server.services[num].type = req.body.server.services[num].type
            server.services[num].name = req.body.server.services[num].name
            server.services[num].url = req.body.server.services[num].url
            server.services[num].port = req.body.server.services[num].port
          }
        } else {
          // Defer adding new services until the loop finishes
          push.push(num)
        }
      };
      for (var num=0; num < push.length; num++) {
        service[num].delete.remove();
        server.services.push(service[num]);
      };
      console.log(server.toObject());
      
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