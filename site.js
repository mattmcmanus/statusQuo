var config = JSON.parse(require('fs').readFileSync('./config.json', 'utf8')),
    consumerKey=    'KZHCsJ6yIpWQbmI2Adkrg',
    consumerSecret= 'ZusgzvUah75KmHVsIatjAWw0SconKzdyuc4B5vDL4',
    OAuth= require('oauth').OAuth,
    oa= new OAuth("https://twitter.com/oauth/request_token",
                     "https://twitter.com/oauth/access_token", 
                     consumerKey, consumerSecret, 
                     "1.0A", "http://172.25.68.218:8000/oauth/callback", "HMAC-SHA1");

exports.index = function(req, res){
  res.render('index', {
    locals: {
      title: "Dashboard",
      servers: req.config
    }
  });
};

exports.config = function(req, res, next){
  req.config = config;
  next();
};

exports.login = function(req, res){
  if (!req.session.user) {
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

exports.oauthCallback = function(req, res){
    if (req.session.oauth) {
      req.session.oauth.verifier = req.query.oauth_verifier
      
      var oauth = req.session.oauth;
      oa.getOAuthAccessToken(oauth.token,oauth.token_secret,oauth.verifier, 
        function(error, oauth_access_token, oauth_access_token_secret, results){
          req.session.oauth.access_token = oauth_access_token;
          req.session.oauth.access_token_secret = oauth_access_token_secret;
          
          res.cookie('loggedIn', '1', { path: '/', expires: new Date(Date.now() + 900000), httpOnly: true });
          
          res.redirect('/user');
        }
      );
    }
};

exports.user = function(req, res){
  if (req.cookies.loggedin && req.session.oauth) {
    oa.get("http://api.twitter.com/1/account/verify_credentials.json", req.session.oauth.access_token, req.session.oauth.access_token_secret, function(error, data) {
      req.session.user = JSON.parse(data);
      
      res.render('user', {
        locals: {
          title:"Your Account",
          user:req.session.user
        }
      });
    });
  } else {
    console.log('/user: No session info, redirecting to login');
    res.redirect('/login')
  }
};