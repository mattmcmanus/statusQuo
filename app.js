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
      user = require('./user'),
      service = require('./service'),
      server = require('./server');

function compile(str, path, fn) {
  stylus(str)
    .set('filename', path)
    .set('compress', false)
    .render(fn);
}

app.configure(function(){
  // Templating Setup
  app.set('view engine', 'jade');
  app.use(stylus.middleware({src: views,dest: pub,compile: compile}));
  // Files
  app.use(express.static(pub));
  app.use(express.favicon());
  
  app.use(express.logger({ format: '":method :url" :status' }));
  app.use(express.cookieParser());
  app.use(express.bodyParser());
  app.use(express.errorHandler({ dumpExceptions: true }));
  app.use(express.session({secret:'St@tu$Qu0', cookie: { maxAge: 1209600 }}));
});

// Here we assume all errors as 500
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
  body_classes: function(req, res) {
    var path = require('url').parse(req.url).pathname;
    if (path == '/')
      return 'front'
    else {
      classes = path.substr(1).split('/');
      classes[0] = 'type-' + classes[0];
      if (classes[1] && classes[1] != 'add') 
        classes[1] = 'service'+classes[1];
      classes.push('page');
      return classes.join(' ');
    }
  },
  session: function(req,res) {
    return req.session;
  },
  page: function(req, res){
    return req.url;
  }, 
  messages: function(req, res){
    var buf = []
      , messages = req.flash()
      , types = Object.keys(messages)
      , len = types.length;
    if (!len) return '';
    buf.push('<div id="messages">');
    
    for (var i = 0; i < len; ++i) {
      var type = types[i]
        , msgs = messages[type];
      if (msgs) {
        buf.push('  <ul class="' + type + '">');
        for (var j = 0, len = msgs.length; j < len; ++j) {
          var msg = msgs[j];
          buf.push('    <li>' + msg + '</li>');
        }
        buf.push('  </ul>');
      }
    }
    buf.push('</div>');
    return buf.join('\n');
  }
  
});


// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                  The Routes, THE ROUTES!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/', site.config, site.index);

app.get('/login', user.login);
app.get('/oauth/callback', user.oauthCallback, user.verify);
app.get('/setup', user.setup);
app.post('/setup', user.create)
app.get('/user', user.authenticated, user.view);

app.get('/server/add', user.authenticated, server.add);
app.post('/server/add', server.create)
app.get('/server/:id', user.authenticated, server.view);
app.get('/server/:id/edit', user.authenticated, server.edit);
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
