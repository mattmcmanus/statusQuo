var _ = require('underscore')
  , sq
    

sq = exports = module.exports = {
    //Export module dependencies, reduces need for later modules to require everything.
    // Thanks Calipso: https://github.com/cliftonc/calipso/blob/master/lib/calipso.js
    lib: {
        sys           : require('sys')
      , fs            : require('fs')
      , _date         : require('underscore.date')
      , http          : require('http')
      , express       : require('express')
      , stylus        : require('stylus')
      , everyauth     : require('everyauth')
      , mongoose      : require('mongoose')
      , mongooseAuth  : require('mongoose-auth')
      , request       : require('request')
      , async         : require('async')
      , HTTPStatus    : require('http-status')
    }
  , jobs : [] 
  
  //                                Utility Functions
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  , isAuth: function(req, res, next) {
    //log(req.cookies, "isAuthenticated Cookies")
    if (req.session && req.session.auth && req.session.auth.loggedIn) {
      next()
    } else {
      res.render('page', {
        status: 403,
        title: "Forbidden: You've tried to access a restricted page",
        body: "<a href=\"/login\">Please sign in</a>"
      })
    }  
  }

  , debug: function(toLog, title) {
    if (title) console.log("\n======================  "+title+"  ============================================")
    console.log(toLog)
    if (title) console.log("======================  /"+title+"  ===========================================\n")
  }
  
}