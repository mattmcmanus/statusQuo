require('./lib/underscore.js')

var sys = require('sys'),
    fs = require('fs'),
    http = require('http'),
    express = require('express'),
    stylus = require('stylus'),
    // Some Basic variable setting
    pub = __dirname + '/public',
    views = __dirname + '/views',
    // Load server and routes
    app = express.createServer(),
    site = require('./site'),
    service = require('./service'),
    server = require('./server');

function compile(str, path, fn) {
  stylus(str)
    .set('filename', path)
    .set('compress', true)
    .render(fn);
}

app.configure(function(){
  // Templating Setup
  app.set('views', views);
  app.set('view engine', 'jade');
  app.use(stylus.middleware({src: views,dest: pub,compile: compile}));
  // Files
  app.use(express.staticProvider(pub));
  app.use(express.favicon());
  
  app.use(express.logger({ format: '":method :url" :status' }));
  app.use(express.cookieDecoder());
  app.use(express.bodyDecoder());
  app.use(express.errorHandler({ dumpExceptions: true }));
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
   
   
 
//                      Dynamic Helpers
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.dynamicHelpers({
  messages: function(req, res){
    return function(){
      var messages = req.flash();
      return res.partial('messages', {
        object: messages,
        as: 'types',
        locals: { hasMessages: Object.keys(messages).length },
        dynamicHelpers: false
      });
    }
  }
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                  The Routes, THE ROUTES!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/', site.config, site.index);

app.get('/server/add', server.add);
app.post('/server/add', server.create)
app.get('/server/:id', server.view);
app.get('/server/:id/edit', server.edit);
app.post('/server/:id/edit', server.update);

// Check a Site
app.all('/check/:id', site.config, service.load);
app.get('/check/:id', service.check)

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
