var consumerKey=    'KZHCsJ6yIpWQbmI2Adkrg',
    consumerSecret= 'ZusgzvUah75KmHVsIatjAWw0SconKzdyuc4B5vDL4',
    OAuth= require('oauth').OAuth,
    oa= new OAuth("https://twitter.com/oauth/request_token",
                  "https://twitter.com/oauth/access_token", 
                  consumerKey, consumerSecret, 
                  "1.0A", "http://172.25.68.218:8000/oauth/callback", "HMAC-SHA1"),
    users = {
      default: {
          name: '',
          email: '',
          url: '',
          profile_image_url: '',
          token: '',
          token_secret: ''
          access_token: '',
          access_token_secret: ''
      }
    };

// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                  AUTH ATTACK!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
exports.verify = function(req, res) {
  oa.get("http://api.twitter.com/1/account/verify_credentials.json", req.session.oauth.access_token, req.session.oauth.access_token_secret, function(error, data) {
    req.session.user = JSON.parse(data);
    var user = users[req.session.user.screen_name];
    if (user)
      res.redirect('/setup')
    else
      res.redirect('/user')
  });
};

exports.setup= function(req, res) {
  res.render('user/setup', {
    locals: {
      title:"Welcome! Please verify you informaiton"
    }
  });
};

exports.create = function(req, res) {
  
};

exports.login = function(req, res){
  if (req.session && !req.session.user) {
    if (!req.session.oauth) req.session.oauth = {};
    oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
      if(error) sys.puts('error :' + JSON.stringify(error))
      else { 
        req.session.oauth.token = oauth_token;
        req.session.oauth.token_secret = oauth_token_secret;
        res.redirect('https://twitter.com/oauth/authenticate?oauth_token='+oauth_token);
       }
    });
  } else {
    console.log('/login: Session already created')
    res.redirect('/user')
  }
};

exports.oauthCallback = function(req, res, next){
    if (req.session.oauth) {
      req.session.oauth.verifier = req.query.oauth_verifier
      
      var oauth = req.session.oauth;
      oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
        function(error, oauth_access_token, oauth_access_token_secret, results){
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          res.redirect('/user');
        }
      );
      next();
    } else {
      next(new Error('No OAuth information stored in the session. How did you get here?'));
    }
};

exports.logout = function(req, res) {
  if (req.session)
    req.session.destroy(title = "You have been logged out")
  else 
    title = "You are already logged out";
  res.render('user/logout', {
    locals: {
      title:title
    }
  });
}

exports.view = function(req, res){
  if (req.session && req.session.user) {
    res.render('user/view', {
      locals: {
        title:"Your Account",
        user:req.session.user
      }
    });
  } else {
    console.log('/user: No session info, redirecting to login');
    res.redirect('/login')
  }
};