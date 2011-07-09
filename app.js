

require.paths.unshift(__dirname); //make local paths accessible

var fs = require('fs')
  , express = require('express')
  , mongoose = require('mongoose')
  , _ = require('underscore')
  , sq = require('./lib/statusquo')
  , RedisStore = require('connect-redis')(express)

// Local App Variables
var path = __dirname
  , pub = __dirname + '/public'
  , port = 8000
  , app
  
/**
 * Initial bootstrapping
 */
exports.boot = function(next) {

  //Create our express instance
  app = express.createServer();
  app.path = path;
  
  //                     Socket.io
  // - - - - - - - - - - - - - - - - - - - - - - - - - - -
  sq.io = require('socket.io').listen(app);
  
  // Load configuration settings
  require("./config.js")(app, sq, express);
  
  // Load Models
  // * Eventually I'll write a dynamic loader. This is just easier for now.
  mongoose.connect(app.set('db-uri'))
  require('./models/user.js')(app, sq)
  require('./models/server.js')(app, sq)

  // Bootstrap application
  bootApplication(app, function() {
    next(app);
  });

};

/**
 *  App settings and middleware
 *  Any of these can be added into the by environment configuration files to
 *  enable modification by env.
 */
function bootApplication(app, next) {

  app.use(express.static(pub))
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.cookieParser())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.session({ store: new RedisStore, secret: 'qu0'}))
  app.use(sq.lib.stylus.middleware({src:path+"/views/",dest: pub}))
  app.use(sq.lib.mongooseAuth.middleware())  

  
  //                     Routes
  // - - - - - - - - - - - - - - - - - - - - - - - - - - -
  require('./lib/user')(app, sq);
  require('./lib/server')(app, sq);
  
  //                     Helpers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //app.helpers(require('./helpers.js').helpers);
  app.dynamicHelpers(require('./helpers.js').dynamicHelpers)
  sq.lib.mongooseAuth.helpExpress(app)
  
  next(app)
}

// allow normal node loading if appropriate
if (!module.parent) {

  console.log("");
  console.log("\x1b[36m --------------   StatusQuo  ---------------   \x1b[0m");
  console.log("");

  exports.boot(function(app) {
    require('socket.io').listen(app)
    app.listen(port)
    console.log("\x1b[36m- listening on port: \x1b[0m %d", app.address().port);
    console.log("\x1b[36m- configured for\x1b[0m %s \x1b[36menvironment\x1b[0m\r\n", global.process.env.NODE_ENV || 'development');

  });

}