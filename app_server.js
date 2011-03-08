var global = require('./routes/global');

module.exports = function(app, Server){
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
    
  })
  
  app.get('/server/add', function(req, res){
    res.render('server/add', {
      title: "Add a server"
    });
  });
  
  app.post('/server/add', function(req, res){
    console.log(req.body.server);
    res.redirect('back');
  })
  
  app.get('/server/:id', function(req, res){
    res.render('server/view');
  });
  
  app.get('/server/:id/edit', function(req, res){
    res.render('server/edit');
  });
  
  app.post('/server/:id/edit',function(req, res){
    res.render('server/add');
  });
};