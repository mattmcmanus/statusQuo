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
      , io            : require('socket.io')
      , request       : require('request')
      , async         : require('async')
      , spawn         : require('child_process').spawn
      , HTTPStatus    : require('http-status')
    }
  , settings : JSON.parse(require('fs').readFileSync('./config.json', 'utf8'))
  
  //                                Utility Functions
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  , isAuthenticated: function(req, res, next) {
    //log(req.cookies, "isAuthenticated Cookies")
    if (req.session && req.session.auth.loggedIn) {
      next()
    } else {
      res.render('page', {
        title: "You've tried to access a restricted page",
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