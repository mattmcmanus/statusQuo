var express = require('express')
  , _ = require('underscore')
  , sq = require('./lib/statusquo')
  // Some Basic variables
  , pub = __dirname + '/public'
  , views = __dirname + '/views'

sq.settings = JSON.parse(sq.lib.fs.readFileSync('./config.json', 'utf8'))

var Promise = sq.lib.everyauth.Promise;

  sq.lib.everyauth.debug = true;
  
  var Schema = sq.lib.mongoose.Schema
    , ObjectId = sq.lib.mongoose.SchemaTypes.ObjectId
    , mongoose = sq.lib.mongoose

  //                          Users
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var UserSchema = new Schema({})

  UserSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  UserSchema.plugin(sq.lib.mongooseAuth, {
      everymodule: {
        everyauth: {
            User: function () {
              return sq.User;
            }
        }
      }
    , twitter: {
        everyauth: {
            myHostname: sq.settings.defaults.myHostname
          , consumerKey: sq.settings.defaults.oauthConsumerKey
          , consumerSecret: sq.settings.defaults.oauthConsumerSecret
          //, authorizePath: '/oauth/authenticate'
          , redirectPath: '/'
        }
      }
    , password: {
       loginWith: 'email'
      , extraParams: {
            phone: String
          , carrier: String
          , name: {
                first: String
              , last: String
            }
        }
      , everyauth: {
            getLoginPath: '/login'
          , postLoginPath: '/login'
          , loginView: 'user/login.jade'
          , getRegisterPath: '/register'
          , postRegisterPath: '/register'
          , registerView: 'user/register.jade'
          , loginSuccessRedirect: '/'
          , registerSuccessRedirect: '/'
          , displayRegister: function (req, res) {
              var user = req.user;
              var userParams = {};
              sq.debug(user, "displayRegister")
              if (user && user.twit && user.twit.name) userParams.name = user.twit.name;
              if (user && user.twit && user.twit.screenName) userParams.screenName = user.twit.screenName;
              if (user && user.twit && user.twit.profileImageUrl) userParams.profileImageUrl = user.twit.profileImageUrl;
              res.render('user/register', { userParams: userParams });
            }
          
        }
    }
  })
  
  UserSchema.pre('save', function(next) {
    if (!this.username)
      this.username = this.twit.screenName
    if (!this.name)
      this.name = this.twit.name
      
    next()
  })
  

var app = express.createServer()

//            Default Config settings
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
var mongooseAuth = require('mongoose-auth')

app.configure(function(){
  // Load default settings from config file
  _.each(sq.settings.defaults, function(setting, key) { app.set(key, setting) })
  _.each(sq.settings.development, function(setting, key) { app.set(key, setting) })
  //Set Stylus middle to generate proper CSS files in the proper plac
  app.use(sq.lib.stylus.middleware({src: views,dest: pub}))
  // Files
  app.use(express.static(pub))
  app.use(express.favicon())
  app.use(express.logger({ format: '\x1b[1m:method\x1b[0m \x1b[33m:url\x1b[0m :response-time ms' }))
  app.use(express.cookieParser())
  app.use(express.bodyParser())
  app.use(express.methodOverride())
  app.use(express.session({ secret: 'qu0'}))
  app.use(app.router)
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  app.use(mongooseAuth.middleware())
});

sq.db = sq.lib.mongoose.connect(app.set('db-uri'))
sq.lib.mongoose.model('User', UserSchema)
sq.User = sq.lib.mongoose.model('User')

sq.lib.mongooseAuth.helpExpress(app);

app.get('/', function(req,res){
  sq.debug(req.user, "req.user")
  res.send("Hellz yeah")
})

app.listen(8000)
console.log("- - - - Server started - - - - ")
