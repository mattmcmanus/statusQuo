require('./lib/underscore.js')

var sys = require('sys')
  , fs = require('fs')
  , http = require('http')
  , express = require('express')
  , stylus = require('stylus')
  , mongoose = require('mongoose')
  // Some Basic variable setting
  , pub = __dirname + '/public'
  , views = __dirname + '/views'
  , User
  , Server
  , Service
  , db
  // Load server and routes
  , app = module.exports = express.createServer();
  
app.configure(function(){
  // Templating Setup
  app.set('view engine', 'jade');
  app.use(stylus.middleware({src: views,dest: pub}));
  // Files
  app.use(express.static(pub));
  app.use(express.favicon());
  
  app.use(express.logger({ format: '":method :url" :status' }));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.session({secret:'St@tu$Qu0', cookie: { maxAge: 1209600 }}));
});

app.configure('development', function() {
  app.set('db-uri', 'mongodb://localhost/sq_dev');
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//                      Dynamic Helpers
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//app.helpers(require('./helpers.js').helpers);
app.dynamicHelpers(require('./helpers.js').dynamicHelpers);

//                      Models
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
require('./models').defineModels(mongoose, function() {
  app.User = User = mongoose.model('User');
  app.Server = Server = mongoose.model('Server');
  db = mongoose.connect(app.set('db-uri'));
})

//                      Errors
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.error(function(err, req, res){
  res.render('500', {
    status: 500,
    locals: {
      title: "Da server asplode",
      error: err
    }
  });
});

//                  The Routes, THE ROUTES!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
require('./routes/site')(app);
require('./routes/user')(app);
require('./routes/server')(app);

app.listen('8000');
console.log('Express server started on port %s', app.address().port);


// - - - - - - - - - - - - - - - - - - - - - - - - - - 
//                 socket.io 
// - - - - - - - - - - - - - - - - - - - - - - - - - - 
//var socket = io.listen(app); 
//socket.on('connection', function(client){ 
//  client.on('message', function(commands){ 
//    _.each(commands,function(action, command){
//      if (command == 'ping') {
//        // Set things up
//        var buffer = [],
//        ip,
//        exec = require('child_process').exec,
//        ping;
//        
//        // Load up the servers IP
//        _.each(serversConfig,function(server){
//          if (ip == null && server.name == action) {
//            if (server.ip) {
//              ip = server.ip;
//            } else {
//              //TODO: Throw a proper error
//            };
//          }
//        })
//        // It's time to ping!
//        //var ping = spawn('ping ' + ip );
//        //ping.stdout.on('data', function (data) {
//        //  console.log('stdout: ' + data);
//        //});
//        
//        //ping.stderr.on('data', function (data) {
//        //  console.log('stderr: ' + data);
//        //});
//        
//        //ping.on('exit', function (code) {
//        //  console.log('child process exited with code ' + code);
//        //});
//        console.log("pinging: "+ ip);
//        //ping = exec('ping ' + ip, 
//        //  function (error, stdout, stderr) {
//        //    console.log('stdout: ' + stdout);
//        //    console.log('stderr: ' + stderr);
//        //    if (error !== null) {
//        //      console.log('exec error: ' + error);
//        //    }
//        //});
//        
//        // Stop this
//        //setTimeout(ping.kill(),1000)
//        //
//      }
//      
//    });
//  });
//  
//  client.on('disconnect', function(){
//    console.log('socket.io: DISCONNECTED!')
//  }) 
//  
//});
