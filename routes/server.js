var global = require('./global');

module.exports = function(app){
  app.get('/', function(req, res){
    if (req.session.user) {
      Server.find({user_id: req.session.user.id}, function(err, servers){
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
  
  app.get('/server/new', function(req, res){
    res.render('server/new', {
      server: new app.Server()
    });
  });
  
  app.post('/server/new', function(req, res){
    console.log(req.body.server);
    res.redirect('back');
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