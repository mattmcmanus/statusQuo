module.exports = function(app){
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