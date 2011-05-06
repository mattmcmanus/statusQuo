var sys = require('sys')
  , fs = require('fs')
  , _ = require('underscore')
  , http = require('http')
  , express = require('express')
  , stylus = require('stylus')
  , RedisStore = require('connect-redis')
  , mongoose = require('mongoose')
  , io = require('socket.io')
  , everyauth = require('everyauth')
  // Some Basic variables
  , settings = JSON.parse(fs.readFileSync('./config.json', 'utf8'))
  , pub = __dirname + '/public'
  , views = __dirname + '/views'
  , User
  , Server
  , Service
  , db
  // Load server and routes
  , app = module.exports = express.createServer();
//            Default Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
app.configure(function(){
  // Load default settings from config file
  _.each(settings.defaults, function(setting, key) { app.set(key, setting) })
  //Set Stylus middle to generate proper CSS files in the proper plac
  app.use(stylus.middleware({src: views,dest: pub}))
   // Files
  app.use(express.static(pub))
  app.use(express.favicon())
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.cookieParser())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.session({ store: new RedisStore, secret: 'qu0'}))
  app.use(app.router)
});
//            Development Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
app.configure('development', function() {
  // Load DEvelopment settings from config file
  _.each(settings.development, function(setting, key) { app.set(key, setting) })
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//            Prouction Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
app.configure('production', function() {
  // Load production settings from config file
  _.each(settings.production, function(setting, key) { app.set(key, setting) })
  app.use(express.errorHandler());
});

//                      Dynamic Helpers
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//app.helpers(require('./helpers.js').helpers);
app.dynamicHelpers(require('./helpers.js').dynamicHelpers);
everyauth.helpExpress(app);

//                      Models
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
require('./models').defineModels(mongoose, function() {
  app.User = User = mongoose.model('User')
  app.Server = Server = mongoose.model('Server')
  app.LoginToken = LoginToken = mongoose.model('LoginToken')
  app.ServiceResponse = ServiceResponse = mongoose.model('ServiceResponse')
  db = mongoose.connect(app.set('db-uri'))
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
require('./routes/user')(app);
require('./routes/server')(app);
everyauth.debug = true;
app.use(everyauth.middleware())

//app.listen( process.env.PORT || '8000' );
//console.log('Express server started on port %s', app.address().port);


// - - - - - - - - - - - - - - - - - - - - - - - - - -
//                 socket.io
// - - - - - - - - - - - - - - - - - - - - - - - - - -
var socket = io.listen(app);
socket.on('connection', function(client){
  var ping
  client.on('message', function(commands){
    _.each(commands,function(item, command){
      if (command == 'ping') {
        // Set things up
        var buffer = []
          , spawn = require('child_process').spawn
          , pattern = /(\d+?) bytes from (.+?): icmp_req=(\d+?) ttl=(\d+?) time=(.+) ms/
          , output

        ping = spawn('ping', [item])

        ping.stdout.on('data', function (data) {
          data = data.toString().slice(0,-1)
          var regexOutput = pattern.exec(data)
          output = (regexOutput) ? {bytes_sent:regexOutput[1], ip: regexOutput[2], icmp_req: regexOutput[3], ttl: regexOutput[4], time: regexOutput[5]} : {}
          client.send(output)
        });

        ping.stderr.on('data', function (data) {
          console.log('stderr: ' + data);
        });

        ping.on('exit', function (code) {
          console.log('child process exited with code ' + code);
        });
      } else if (command === 'kill' && item === 'ping') {
        if (ping) ping.kill()
      }

    });
  });

  client.on('disconnect', function(){
    console.log('socket.io: DISCONNECTED!')
  })

});
