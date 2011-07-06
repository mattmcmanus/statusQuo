module.exports = function(app, sq){
  app.get('/logout', function(req, res) {
    if (req.session){
      //app.LoginToken.remove({ email: req.user.email }, function() {});
      req.session.destroy(function() {})
      //req.logout()
      res.clearCookie('logintoken');
    }
    res.redirect('/')
  })
  
  app.get('/user', sq.isAuth, function(req, res){
    res.render('user/show', {
      title:"Your Account"
    })
  })
}