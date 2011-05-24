var sq = require('../lib/statusquo')

module.exports = function(app){

  function authenticateFromLoginToken(req, res, next) {
    var cookie = JSON.parse(req.cookies.logintoken);
    sq.debug(cookie, "Existing Cookie Info")
    app.LoginToken.findOne({ email: cookie.email,  series: cookie.series,  token: cookie.token }, (function(err, token) {
      
      if (!token) {
        console.log("Clearing old cookie")
        res.clearCookie('logintoken')
        res.redirect('/login');
        return;
      }
      app.User.findOne({ email: token.email }, function(err, user) {
        if (user) {
          req.user = user
  
          token.token = token.randomToken()
          var loginToken = new app.LoginToken({ email: req.session.user.email })
          token.save(function() {
            res.cookie('logintoken', token.cookieValue, { expires: new Date(Date.now() + 604800000), path: '/', httpOnly: true });
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
    if (req.user || (req.session.auth && req.session.auth.loggedIn)) {
      console.log("loadUser: CurrentUser exists")
      //if (req.user.new === true) {
      //  res.redirect('/user/setup')
      //}
      next()
    } else if (req.cookies.logintoken) {
      console.log("loadUser: Hey Look!  A cookie!")
      authenticateFromLoginToken(req, res, next);
    } else {
      console.log("loadUser: To the cloud!")
      res.redirect('/auth/twitter')
    }
  }
  
  app.get('/login', returnToAfterLogin, loadUser, function(req, res){
    //var loginToken = new app.LoginToken({ email: req.user.email })
    //sq.debug(loginToken.cookieValue, "loginToken.cookieValue")
    //loginToken.save(function() {
    //  console.log("Writing login token")
    //  res.cookie('logintoken', loginToken.cookieValue, { expires: new Date(Date.now() + 604800000), path: '/', httpOnly: true });
    //  res.redirect(req.cookies.returnTo || '/');
    //});
  });
  
  app.get('/user/setup', function(req, res) {
    res.render('user/setup', {
        title:"Welcome! Please verify your information"
      , account: req.newUser
    });
  });
  
  app.post('/user/setup', function(req, res) {
    var user = new app.User(req.body.user);
    req.user = user
    delete req.newUser
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
    });
  });
};