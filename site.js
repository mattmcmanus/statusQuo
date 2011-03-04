var config = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'));

exports.index = function(req, res){
  res.render('index', {
    locals: {
      title: "Dashboard",
      servers: req.config
    }
  });
};

exports.config = function(req, res, next){
  req.config = config;
  next();
};