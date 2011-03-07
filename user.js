var consumerKey = 'KZHCsJ6yIpWQbmI2Adkrg',
    consumerSecret = 'ZusgzvUah75KmHVsIatjAWw0SconKzdyuc4B5vDL4',
    OAuth = require('oauth').OAuth,
    oa = new OAuth("https://twitter.com/oauth/request_token",
                  "https://twitter.com/oauth/access_token", 
                  consumerKey, consumerSecret, 
                  "1.0A", "http://172.25.68.218:8000/oauth/callback", "HMAC-SHA1"),
    users = {
      template: {
          name: '',
          email: '',
          picture: '',
          access_token: '',
          access_token_secret: ''
      }
    };

// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                  AUTH ATTACK!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
exports.authenticated = function(req, res, next) {
  if (req.session && req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }  
}

exports.login = function(req, res){
  if (!req.session.oauth) req.session.oauth = {};
  oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    if (error) new Error(error.data)
    else {
      req.session.oauth.token = oauth_token;
      req.session.oauth.token_secret = oauth_token_secret;
      res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token);
     }
  });
};

exports.oauthCallback = function(req, res, next){
  if (req.session.oauth) {
    req.session.oauth.verifier = req.query.oauth_verifier
    var oauth = req.session.oauth;
    oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
      function(error, oauth_access_token, oauth_access_token_secret, results){
        req.session.oauth.access_token = oauth_access_token;
        req.session.oauth.access_token_secret = oauth_access_token_secret;
        next();
      }
    );
    
  } else {
    next(new Error('No OAuth information stored in the session. How did you get here?'));
  }
};
exports.verify = function(req, res) {
  oa.get("http://api.twitter.com/1/account/verify_credentials.json", req.session.oauth.access_token, req.session.oauth.access_token_secret, function(error, data) {
    if (data) {
      req.session.twitter = JSON.parse(data);
      var user = users[req.session.twitter.screen_name];
      if (user) {
        req.session.user = user;
        res.redirect('/user')
      } else {
        res.redirect('/setup')
      }
    } else {
      console.log('Unable to verify user')
    }
  });
};

exports.setup= function(req, res) {
  if (req.session.twitter) {
    res.render('user/setup', {
      title:"Welcome! Please verify you information",
      user: req.session.twitter
    });
  } else {
    res.redirect('/login')
  }
};

exports.create = function(req, res) {
  var form = req.body.user;
  users[form.username] = {
    username: form.username,
    name: form.name,
    email: form.email,
    picture: form.picture,
    access_token: req.session.oauth.access_token,
    access_token_secret: req.session.oauth.access_token_secret
  }
  req.session.user = users[form.username];
  res.redirect('/user')
};

exports.logout = function(req, res) {
  if (req.session)
    req.session.destroy(title = "You have been logged out")
  else 
    title = "You are already logged out";
  res.render('user/logout', {
    title:title
  });
}

exports.view = function(req, res){
  res.render('user/view', {
    title:"Your Account",
    user:req.session.user
  });
};