var express = require('express')
  , _ = require('underscore')
  , sq = require('./lib/statusquo')
  // Some Basic variables
  , pub = __dirname + '/public'
  , views = __dirname + '/views'
  // Load server
  , app = module.exports = express.createServer();

//            Default Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
sq.settings = JSON.parse(sq.lib.fs.readFileSync('./config.json', 'utf8'))

app.configure(function(){
  // Load default settings from config file
  _.each(sq.settings.defaults, function(setting, key) { app.set(key, setting) })
  //Set Stylus middle to generate proper CSS files in the proper plac
  app.use(sq.lib.stylus.middleware({src: views,dest: pub}))
  // Files
  app.use(express.static(pub))
  app.use(express.favicon())
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.cookieParser())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.session({ store: new sq.lib.RedisStore, secret: 'qu0'}))
  app.use(app.router)
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


//                      Models
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
require('./models').defineModels(sq, function(models) {
  var User, Server, Service, db
  
  db = sq.lib.mongoose.connect(app.set('db-uri'))
  app.User = User = models['User']
  app.Server = Server = models['Server']
  app.LoginToken = LoginToken = models['LoginToken']
  app.ServiceResponse = ServiceResponse = models['ServiceResponse']
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
require('./routes/user')(app, sq);
require('./routes/server')(app, sq);
app.use(sq.lib.mongooseAuth.middleware())


//                     Helpers
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//app.helpers(require('./helpers.js').helpers);
app.dynamicHelpers(require('./helpers.js').dynamicHelpers);
sq.lib.mongooseAuth.helpExpress(app);


// - - - - - - - - - - - - - - - - - - - - - - - - - -
//                 socket.io
// - - - - - - - - - - - - - - - - - - - - - - - - - -
var socket = sq.lib.io.listen(app);
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
