var consumerKey = 'KZHCsJ6yIpWQbmI2Adkrg'
  , consumerSecret = 'ZusgzvUah75KmHVsIatjAWw0SconKzdyuc4B5vDL4'
  , OAuth = require('oauth').OAuth
  , global = require('./global')
  , oa = new OAuth("https://twitter.com/oauth/request_token"
                ,  "https://twitter.com/oauth/access_token"
                ,   consumerKey
                ,   consumerSecret
                ,  "1.0A", "http://172.25.68.218:8000/oauth/callback", "HMAC-SHA1");


module.exports = function(app){
  app.get('/login', function(req, res){
    if (!req.session.oauth) req.session.oauth = {}
    
    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
      if (error) 
        new Error(error.data)
      else {
        req.session.oauth.token = oauth_token
        req.session.oauth.token_secret = oauth_token_secret
        res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token)
       }
    });
  });
  
  app.get('/logout', function(req, res) {
    if (req.session)
      req.session.destroy(title = "You have been logged out")
    else 
      title = "You are already logged out"
    res.render('user/logout', {
      title:title
    });
  })
  
  app.get('/oauth/callback', function(req, res, next){
    if (req.session.oauth) {
      req.session.oauth.verifier = req.query.oauth_verifier
      var oauth = req.session.oauth
      
      oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
        function(error, oauth_access_token, oauth_access_token_secret, results){
          req.session.oauth.access_token = oauth_access_token
          req.session.oauth.access_token_secret = oauth_access_token_secret
          
          app.User.findOne({username: results.screen_name }, function(err, user) {
            if (user) {
              req.session.user = user
              req.flash('success', 'You\'ve successfully logged in!')
              res.redirect('/')
            } else {
              req.flash('info', 'It appears this is your first time logging in! Please fill out the remaining below to steup your account')
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
        res.render('user/setup', {
          title:"Welcome! Please verify you information",
          user: data
        });
      } else {
        console.log('Unable to verify user')
      }
    });
  });
  
  app.post('/user/setup', function(req, res) {
    var user = new app.User(req.body.user);
    user.save(function(err){
      if (!err) {
        req.flash('success', 'You\'re account has been created!')
      } else {
        req.flash('error', 'Err, Something broke when we tried to save your account')
        console.log(err)
      }
      res.redirect('/')
      
    });
    
  })
  
  app.get('/user', global.authenticated, function(req, res){
    res.render('user/view', {
      title:"Your Account",
      user:req.session.user
    });
  });
};