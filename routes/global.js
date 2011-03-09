exports.authenticated = function(req, res, next) {
  if (req.session && req.session.user) {
    next()
  } else {
    req.flash('warning', 'You need to be logged in to see that page')
    res.render('page', {
      title: "You've tried to access a restricted page",
      body: "<a href=\"/login\">Please sign in</a>"
    })
  }  
}