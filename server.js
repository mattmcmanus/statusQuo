require('./lib/underscore.js')

var pub = __dirname + '/public';

// Auto-compile sass to css with "compiler"
// and then serve with connect's staticProvider
var fs = require('fs'),
    http = require('http'),
    express = require('express'),
    less = require('less'),
    sys = require('sys'),
    app = express.createServer(
      express.compiler({ src: pub, enable: ['less'] }),
      express.staticProvider(pub)
    );
    
    //app.use(express.logger({ format: '":method :url" :status' }));
    app.use(express.bodyDecoder());
    
    // "app.router" positions our routes 
    // specifically above the middleware
    // assigned below

    app.use(app.router);

    // When no more middleware require execution, aka
    // our router is finished and did not respond, we
    // can assume that it is "not found". Instead of
    // letting Connect deal with this, we define our
    // custom middleware here to simply pass a NotFound
    // exception
    
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    
    //app.error(function(err, req, res){
    //  res.render('500', {
    //    status: 500,
    //    locals: {
    //      title: "Everything is broken, NOTHING IS FINE",
    //      error: err
    //    } 
    //  });
    //});
    
//Read the config file
var serversConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));

// Route Middleware
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


// ------ ROUTES --------
app.get('/', function(req, res){
  res.render('index',{
        locals: {
          title: "Dashboard",
          servers: serversConfig
        }
    })
});

app.get('/ping/:site', loadSite, function(req, res){
  var request = http.createClient(80, req.site.url).request('GET', '/', {'host': req.site.url});
    request.end();
    request.on('response', function (response) {
      res.send(response.statusCode.toString());
    });
})

app.get('/500', function(req, res, next){
    next(new Error('keyboard cat!'));
});

app.listen('8000');
console.log('Express server started on port %s', app.address().port);

// socket.io 
//var socket = io.listen(server); 
//socket.on('connection', function(client){ 
//  // new client is here! 
//  client.on('message', function(){ … }) 
//  client.on('disconnect', function(){ … }) 
//});
