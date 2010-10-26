require('./lib/underscore.js')

var pub = __dirname + '/public';

// Auto-compile sass to css with "compiler"
// and then serve with connect's staticProvider
var fs = require('fs'),
    http = require('http'),
    express = require('express'),
    less = require('less'),
    app = express.createServer();
    
    app.configure(function(){
        app.set('views', __dirname + '/views');
        app.set('view engine', 'jade');
        app.set('view options');
        app.use(express.bodyDecoder());
        app.use(app.router);
        app.use(express.staticProvider(pub));
    });
    
//Read the config file
var serversConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// ------ ROUTES --------
app.get('/', function(req, res){
  res.render('index',{
        locals: {
            servers: serversConfig
        }
    })
});

function loadSite(req, res, next) {
  var site = null;
  _.each(serversConfig,function(server){
    if (site == null)
      site = _.detect(server.sites, function(s){ return s.id == req.params.site })
  })
  if (site) {
    req.site = site;
    next();
  } else {
    next(new Error('Failed to load site ' + req.params.site));
  }
}

app.get('/ping/:site', loadSite, function(req, res){
  var request = http.createClient(80, req.site.url).request('GET', '/', {'host': req.site.url});
    request.end();
    request.on('response', function (response) {
      res.send(' '+response.statusCode);
    });
})

app.listen('8000');
console.log('Express server started on port %s', app.address().port);





// socket.io 
//var socket = io.listen(server); 
//socket.on('connection', function(client){ 
//  // new client is here! 
//  client.on('message', function(){ … }) 
//  client.on('disconnect', function(){ … }) 
//});
