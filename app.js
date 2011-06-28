var express = require('express')
  , _ = require('underscore')
  , sq = require('./lib/statusquo')
  // Some Basic variables
  , pub = __dirname + '/public'
  , views = __dirname + '/views'
  // Load server
  , RedisStore = require('connect-redis')(express)
  
var app = module.exports = express.createServer(
        express.static(pub)
      , express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' })
      , express.cookieParser()
      , express.bodyParser()
      , express.methodOverride()
      , express.session({ store: new RedisStore, secret: 'qu0'})
      , sq.lib.stylus.middleware({src: views,dest: pub})
    )
  
//            Default Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
app.configure(function(){
  // Load default settings from config file
  _.each(sq.settings.defaults, function(setting, key) { app.set(key, setting) })
});

//            Development Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
//TODO: Refactor so it's not so verbose and repatative. See: https://github.com/cliftonc/calipso/tree/master/conf
app.configure('development', function() {
  // Load DEvelopment settings from config file
  _.each(sq.settings.development, function(setting, key) { app.set(key, setting) })
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

//            Prouction Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
app.configure('production', function() {
  // Load production settings from config file
  _.each(sq.settings.production, function(setting, key) { app.set(key, setting) })
  app.use(express.errorHandler());
});


//                  The Routes, THE ROUTES!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
sq.lib.mongoose.connect(app.set('db-uri'))
require('./routes/user')(app, sq);
require('./routes/server')(app, sq);
app.use(sq.lib.mongooseAuth.middleware())

//                     Helpers
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//app.helpers(require('./helpers.js').helpers);
app.dynamicHelpers(require('./helpers.js').dynamicHelpers);
sq.lib.mongooseAuth.helpExpress(app);

app.listen(8000)
console.log("- - - - Server started - - - - ")

// - - - - - - - - - - - - - - - - - - - - - - - - - -
//                 socket.io
// - - - - - - - - - - - - - - - - - - - - - - - - - -
//var socket = sq.lib.io.listen(app);
//socket.on('connection', function(client){
//  var ping
//  client.on('message', function(commands){
//    _.each(commands,function(item, command){
//      if (command == 'ping') {
//        // Set things up
//        var buffer = []
//          , spawn = require('child_process').spawn
//          , pattern = /(\d+?) bytes from (.+?): icmp_req=(\d+?) ttl=(\d+?) time=(.+) ms/
//          , output
//
//        ping = spawn('ping', [item])
//
//        ping.stdout.on('data', function (data) {
//          data = data.toString().slice(0,-1)
//          var regexOutput = pattern.exec(data)
//          output = (regexOutput) ? {bytes_sent:regexOutput[1], ip: regexOutput[2], icmp_req: regexOutput[3], ttl: regexOutput[4], time: regexOutput[5]} : {}
//          client.send(output)
//        });
//
//        ping.stderr.on('data', function (data) {
//          console.log('stderr: ' + data);
//        });
//
//        ping.on('exit', function (code) {
//          console.log('child process exited with code ' + code);
//        });
//      } else if (command === 'kill' && item === 'ping') {
//        if (ping) ping.kill()
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
