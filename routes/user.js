var OAuth = require('oauth').OAuth
  , global = require('./global')


module.exports = function(app){
  var oa = new OAuth("https://twitter.com/oauth/request_token"
                ,  "https://twitter.com/oauth/access_token"
                ,   app.settings.oauthConsumerKey
                ,   app.settings.oauthConsumerSecret
                ,  "1.0A", "http://util.it.arcadia.edu:8000/oauth/callback", "HMAC-SHA1");
                
  function authenticateFromLoginToken(req, res, next) {
    var cookie = JSON.parse(req.cookies.logintoken);
    console.log(cookie)
    app.LoginToken.findOne({ email: cookie.email,  series: cookie.series,  token: cookie.token }, (function(err, token) {
      
      if (!token) {
        console.log("Clearing old cookie")
        res.clearCookie('logintoken')
        res.redirect('/login');
        return;
      }
      app.User.findOne({ email: token.email }, function(err, user) {
        if (user) {
          req.session.user = user
  
          token.token = token.randomToken()
          var loginToken = new app.LoginToken({ email: req.session.user.email })
          token.save(function() {
            res.cookie('logintoken', token.cookieValue, { maxAge: 604800000, path: '/', httpOnly: true });
            res.redirect(req.cookies.returnTo || '/');
          });
        } else {
          res.redirect('/login');
        }
      });
    }));
  }
  
  function returnToAfterLogin(req, res, next) {
    var returnTo = req.header('Referer') || '/'
    res.cookie('returnTo', returnTo, { maxAge:604800000, path: '/login', httpOnly: true })
    next()
  }
  
  function loadUser(req, res, next) {
    if (req.session.user) {
      console.log("loadUser: CurrentUser exists")
      next()
    } else if (req.cookies.logintoken) {
      console.log("loadUser: Hey Look!  A cookie!")
      authenticateFromLoginToken(req, res, next);
    } else {
      console.log("loadUser: To the cloud!")
      if (!req.session.oauth) req.session.oauth = {}
      oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
        if (error) new Error(error.data)
        else {
          req.session.oauth = { token: oauth_token, token_secret: oauth_token_secret }
          res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
         }
      });
    }
  }
  
  app.get('/login', returnToAfterLogin, loadUser, function(req, res){
    var loginToken = new app.LoginToken({ email: req.session.user.email })
    loginToken.save(function() {
      res.cookie('logintoken', loginToken.cookieValue, { maxAge: 604800000, path: '/', httpOnly: true });
      res.redirect(req.cookies.returnTo || '/');
    });
  });
  
  app.get('/oauth/callback', function(req, res, next){
    if (req.session.oauth) {
      req.session.oauth.verifier = req.query.oauth_verifier
      var oauth = req.session.oauth
      
      oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
        function(error, oauth_access_token, oauth_access_token_secret, results){
          if (error) new Error(error)
          req.session.oauth = { access_token: oauth_access_token, access_token_secret: oauth_access_token_secret }
          app.User.findOne({username: results.screen_name }, function(err, user) {
            if (user) {
              req.session.user = user
              req.flash('success', 'You\'ve successfully logged in!')
              res.redirect('/login')
            } else {
              res.redirect('/user/setup')
            }
          });
        }
      );
    } else
      next(new Error('No OAuth information stored in the session. How did you get here?'))
  });
  
  app.get('/user/setup', function(req, res) {
    oa.get("http://api.twitter.com/1/account/verify_credentials.json", req.session.oauth.access_token, req.session.oauth.access_token_secret, function(error, data) {
      if (data) {
        var account = JSON.parse(data)
        res.render('user/setup', {
            title:"Welcome! Please verify your information"
          , account: account
        });
      } else {
        console.log('Unable to verify user')
      }
    });
  });
  
  app.post('/user/setup', function(req, res) {
    var user = new app.User(req.body.user);
    req.session.user = user;
    user.save(function(err){
      if (!err) {
        req.flash('success', 'You\'re account has been created!')
      } else {
        req.flash('error', 'Err, Something broke when we tried to save your account')
        console.log("Error: /user/setup" + err)
      }
      res.redirect('/login')
      
    });
    
  })
  
  app.get('/logout', function(req, res) {
    if (req.session){
      app.LoginToken.remove({ email: req.session.user.email }, function() {});
      req.session.destroy()
      res.clearCookie('logintoken');
    }
    res.redirect('/')
  })
  
  app.get('/user', global.isAuthenticated, function(req, res){
    res.render('user/view', {
      title:"Your Account",
      user:req.session.user
    });
  });
};