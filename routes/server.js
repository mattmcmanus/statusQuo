var global = require('./global');

module.exports = function(app){
  app.get('/', function(req, res){
    if (req.session.user) {
      app.Server.find({user_id: req.session.user.id}, function(err, servers){
        console.log(servers)
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
    res.render('server/view');
  });
  
  app.get('/server/:id/edit', function(req, res){
    res.render('server/edit');
  });
  
  app.put('/server/:id/edit',function(req, res){
    res.render('server/add');
  });
};