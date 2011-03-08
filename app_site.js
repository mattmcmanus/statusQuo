var config = JSON.parse(require('fs').readFileSync('./config.json', 'utf8'));

module.exports = function(app){
  function loadConfig(req, res, next){
    req.config = config
    next()
  }
  
  app.get('/', loadConfig, function(req, res){
    res.render('index', {
      title: "Dashboard",
      servers: config
    })
  })
}