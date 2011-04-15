
exports.isAuthenticated = function(req, res, next) {
  if (req.session && req.currentUser) {
    next()
  } else {
    res.render('page', {
      title: "You've tried to access a restricted page",
      body: "<a href=\"/login\">Please sign in</a>"
    })
  }  
}