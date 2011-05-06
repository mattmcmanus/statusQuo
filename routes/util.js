
exports.isAuthenticated = function(req, res, next) {
  console.log(req.cookies)
  if (req.session && req.user && req.cookies.logintoken) {
    next()
  } else {
    res.render('page', {
      title: "You've tried to access a restricted page",
      body: "<a href=\"/login\">Please sign in</a>"
    })
  }  
}

exports.log = function(toLog, title) {
  if (title) console.log("\n======================  "+title+"  ============================================")
  console.log(toLog)
  if (title) console.log("======================  /"+title+"  ============================================\n")
}