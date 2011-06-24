module.exports = function(app, sq){
  
  sq.lib.everyauth.debug = true
  
  var Schema = sq.lib.mongoose.Schema
    , ObjectId = sq.lib.mongoose.SchemaTypes.ObjectId
    , mongoose = sq.lib.mongoose

  //                          Users
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var UserSchema = new Schema({})
    , User

  UserSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  UserSchema.plugin(sq.lib.mongooseAuth, {
      everymodule: {
        everyauth: {
            User: function () {
              return User;
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
  
  sq.lib.mongoose.model('User', UserSchema)
  
  
  
  app.get('/logout', function(req, res) {
    if (req.session){
      //app.LoginToken.remove({ email: req.user.email }, function() {});
      req.session.destroy(function() {})
      //req.logout()
      res.clearCookie('logintoken');
    }
    res.redirect('/')
  })
  
  app.get('/user', sq.isAuthenticated, function(req, res){
    res.render('user/view', {
      title:"Your Account",
      user:req.session.user
    })
  })
}