require('./lib/underscore.js')

var pub = __dirname + '/public';

var fs = require('fs'),
    http = require('http'),
    express = require('express'),
    less = require('less'),
    sys = require('sys'),
    io = require('socket.io'),
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


app.get('/getConfig', function(req, res){
  res.send(serversConfig);
});


app.get('/check/:site', loadSite, function(req, res){
  var secure = (req.site.secure)?req.site.secure:false;
  var site = http.createClient((secure)?443:80, req.site.url, secure);
  site.on('error', function(err) {
    sys.debug('unable to connect to ' + req.site.url);
    res.send({statusCode: '500', message: err.message.substr(err.message.indexOf(',')+1)});
  });
    
  var request = site.request('GET', '/', {'host': req.site.url});
  request.end();
  request.on('response', function (response) {
    res.send({statusCode: response.statusCode.toString(), message: "OK" });
  });
})


app.get('/500', function(req, res, next){
    next(new Error('keyboard cat!'));
});


app.listen('8000');
console.log('Express server started on port %s', app.address().port);


// - - - - - - - - - - - - - - - - - - - - - - - - - - 
//                 socket.io 
// - - - - - - - - - - - - - - - - - - - - - - - - - - 
var socket = io.listen(app); 
socket.on('connection', function(client){ 
  client.on('message', function(commands){ 
    _.each(commands,function(action, command){
      if (command == 'ping') {
        // Set things up
        var buffer = [],
        ip,
        exec = require('child_process').exec,
        ping;
        
        // Load up the servers IP
        _.each(serversConfig,function(server){
          if (ip == null && server.name == action) {
            if (server.ip) {
              ip = server.ip;
            } else {
              //TODO: Throw a proper error
            };
          }
        })
        // It's time to ping!
        //var ping = spawn('ping ' + ip );
        //ping.stdout.on('data', function (data) {
        //  console.log('stdout: ' + data);
        //});
        
        //ping.stderr.on('data', function (data) {
        //  console.log('stderr: ' + data);
        //});
        
        //ping.on('exit', function (code) {
        //  console.log('child process exited with code ' + code);
        //});
        console.log("pinging: "+ ip);
        //ping = exec('ping ' + ip, 
        //  function (error, stdout, stderr) {
        //    console.log('stdout: ' + stdout);
        //    console.log('stderr: ' + stderr);
        //    if (error !== null) {
        //      console.log('exec error: ' + error);
        //    }
        //});
        
        // Stop this
        //setTimeout(ping.kill(),1000)
        //
      }
      
    });
  });
  
  client.on('disconnect', function(){
    console.log('socket.io: DISCONNECTED!')
  }) 
  
});
