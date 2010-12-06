require('./lib/underscore.js')

var pub = __dirname + '/public';

var fs = require('fs'),
    http = require('http'),
    express = require('express'),
    less = require('less'),
    sys = require('sys'),
    app = express.createServer(
      express.compiler({ src: pub, enable: ['less'] }),
      express.staticProvider(pub)
    );
    
    
    app.configure(function(){
      app.use(express.logger({ format: '":method :url" :status' }));
      app.use(express.bodyDecoder());
      app.use(app.router);
      app.set('views', __dirname + '/views');
      app.set('view engine', 'jade');
      app.use(express.errorHandler({ dumpExceptions: true }));
      //app.use(function(req, res, next){
      //  next(new NotFound(req.url));
      //});
    });
    
    function NotFound(path){
        this.name = 'NotFound';
        if (path) {
            Error.call(this, 'Cannot find ' + path);
            this.path = path;
        } else {
            Error.call(this, 'Not Found');
        }
        Error.captureStackTrace(this, arguments.callee);
    }
    
    sys.inherits(NotFound, Error);
    
    process.on('uncaughtException', function (err) {
      console.error('uncaughtException: ' + err);
    });
// We can call app.error() several times as shown below.
// Here we check for an instanceof NotFound and show the
// 404 page, or we pass on to the next error handler.

// These handlers could potentially be defined within
// configure() blocks to provide introspection when
// in the development environment.

app.error(function(err, req, res, next){
  if (err instanceof NotFound) {
    res.render('404', {
      status: 404,
      locals: {
        title: "Listen, Whatever the heck you are looking for is not here",
        error: err
      }
    });
  } else {
    next(err);
  }
});

// Here we assume all errors as 500 for the simplicity of
// this demo, however you can choose whatever you like

app.error(function(err, req, res){
  res.render('500', {
    status: 500,
    locals: {
      title: "Da server asplode",
      error: err
    }
  });
});
    
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

  function checkSite(url){
    var site = http.createClient(80, url);
    site.on('error', function(err) {
        sys.debug('unable to connect to ' + url);
    });

    
    var request = site.request('GET', '/', {'host': url});
    request.end();
    return request;
  }

//function pingServer(){
//  
//}

// ------ ROUTES --------
app.get('/', function(req, res){
  res.render('index',{
    locals: {
      title: "Dashboard",
      servers: serversConfig
    }
  })
});

app.get('/check/:site', loadSite, function(req, res){
  var request = checkSite(req.site.url);
  request.on('response', function (response) {
    res.send({status: response.statusCode.toString()});
  });
})

app.get('/500', function(req, res, next){
    next(new Error('keyboard cat!'));
});

app.listen('8000');
console.log('Express server started on port %s', app.address().port);





// socket.io 


//var socket = io.listen(app); 
//socket.on('connection', function(client){ 
//  console.log('SOCKETED!')
//  client.on('message', function(){ 
//      
//  }) 
//  client.on('disconnect', function(){
//      
//  
//  }) 
//});
