exports.add = function(req, res){
  res.render('server/add', {
    title: "Add a server"
  });
};

exports.create = function(req, res){
  console.log(req.body.server);
  res.redirect('back');
};

exports.edit = function(req, res){
  res.render('server/edit');
};

exports.view = function(req, res){
  res.render('server/view');
};

exports.update = function(req, res){
  res.render('server/add');
};