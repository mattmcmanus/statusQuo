var global = require('./global');

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
      res.render('index', {
        title: "Status Quo"
      })
    }
    
  });
  
  app.get('/server/new', global.authenticated, function(req, res){
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
    app.Server.findOne({_id: req.params.id}, function(err, s) {
      res.render('server/show', {server: s});
    })
  });
  
  app.get('/server/:id/edit', function(req, res){
    app.Server.findOne({_id: req.params.id}, function(err, s) {
      res.render('server/edit', {server: s});
    })
  });
  
  app.put('/server/:id', function(req, res, next){
    console.log(req.params)
    app.Server.findOne({_id: req.params.id}, function(err, server) {
      if(!s) return next(new NotFound('That server disappeared!'));
      server.update = Date.now;
      server.ip = req.body.server.ip;
      server.hostname = req.body.server.hostname;
      server.os = req.body.server.os;
      
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
};