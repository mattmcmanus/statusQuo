require('./lib/underscore.js')

// Some setup
var pub = __dirname + '/public';

var fs = require('fs'),
    http = require('http'),
    express = require('express'),
    less = require('less'),
    sys = require('sys'),
    io = require('socket.io'),
    app = express.createServer(
      express.compiler({ src: pub, enable: ['less'] }),
      express.staticProvider(pub),
      express.favicon(),
      //Session support
      express.cookieDecoder(),
      express.session({secret:'St@tu$Qu0'})
    );
    
    app.configure(function(){
      //Basic setup
      app.use(express.logger({ format: '":method :url" :status' }));
      app.use(express.bodyDecoder());
      app.use(app.router);
      app.use(express.errorHandler({ dumpExceptions: true }));
            
      //Templating Setup
      app.set('views', __dirname + '/views');
      app.set('view engine', 'jade');
    });
      
    //process.on('uncaughtException', function (err) {
    //  console.error('uncaughtException: ' + err);
    //});
// Here we assume all errors as 500 for the simplicity of
// this demo, however you can choose whatever you like
app.error(function(err, req, res){
  res.render('500', {
    status: 500,
    locals: {
      title: "Da server asplode",
      error: err
    }
  });
});
   
   
 
//Read the config file
var serversConfig = JSON.parse(fs.readFileSync('./config.json', 'utf8'));


//                      Dynamic Helpers
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//app.dynamicHelpers({
//  messages: function(req, res){
//    return function(){
//      var messages = req.flash();
//      return res.partial('messages', {
//        object: messages,
//        as: 'types',
//        locals: { hasMessages: Object.keys(messages).length },
//        dynamicHelpers: false
//      });
//    }
//  }
//});


//                      Route Middleware
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
function loadSite(req, res, next) {
  var site = null;
  _.each(serversConfig,function(server){
    if (site == null)
      site = _.detect(server.sites, function(s){ return s.id == req.params.site })
  })
  if (site) {
    req.site = site;
    next();
  } else {
    next(new Error('Failed to load site ' + req.params.site));
  }
}

// - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
//                  The Routes, THE ROUTES!
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/', function(req, res){
  res.render('index', {
    locals: {
      title: "Dashboard",
      servers: serversConfig
    }
  });
});

//                      Load the config
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/getConfig', function(req, res){
  res.send(serversConfig);
});

//                      Check a Site
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/check/:site', loadSite, function(req, res){
  var secure = (req.site.secure)?req.site.secure:false;
  var site = http.createClient((secure)?443:80, req.site.url, secure);
  site.on('error', function(err) {
    sys.debug('unable to connect to ' + req.site.url);
    res.send({statusCode: '500', message: err.message.substr(err.message.indexOf(',')+1)});
  });
    
  var request = site.request('GET', '/', {'host': req.site.url});
  request.end();
  request.on('response', function (response) {
    res.send({statusCode: response.statusCode.toString(), message: "OK" });
  });
})

//                      LOGIN
// - - - - - - - - - - - - - - - - - - - - - - - - - - - 
app.get('/login', function(req, res){
  if (!req.session.user) {
    var OAuth= require('oauth').OAuth,
    consumerKey=    'KZHCsJ6yIpWQbmI2Adkrg',
    consumerSecret= 'ZusgzvUah75KmHVsIatjAWw0SconKzdyuc4B5vDL4',
    oa= new OAuth("https://twitter.com/oauth/request_token",
                     "https://twitter.com/oauth/access_token", 
                     consumerKey, consumerSecret, 
                     "1.0A", "http://statusquo.ablegray.com:8000/oauth/callback", "HMAC-SHA1");
    
    //oa.getOAuthRequestToken(function(error, oauth_token, oauth_token_secret, results){
    //  if(error) sys.puts('error :' + JSON.stringify(error))
    //   else { 
    //     sys.puts('oauth_token: ' + oauth_token)
    //     sys.puts('oauth_token_secret: ' + oauth_token_secret)
    //     sys.puts('requestoken results: ' + sys.inspect(results))
    //     sys.puts("Requesting access token")
    //   }
    //});
    
    var access_token= '14528708-zm7pKtXLlq5HqSdQSiUX4d1h8Plfwd5OZDfFaqjR8',
    access_token_secret= 'ZRGBOU2ZyrloludBLbrw8e0yrv88QdrcxDDQexbbE';
    oa.get("http://api.twitter.com/1/account/verify_credentials.json", access_token, access_token_secret, function(error, data) {
      req.session.regenerate(function(){
        req.session.user = JSON.parse(data);
        res.redirect('/user')
      });
    });
  } else {
    res.redirect('/user')
  }
});

app.get('/user', function(req, res){
  if (req.session.user) {
    console.log(req.session.user.name);
    res.render('user', {
      locals: {
        title:"Your Account",
        user:req.session.user
      }
    });
  } else {
    res.redirect('/login')
  }
});

//                      Oauth callback
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/oauth/callback', function(req, res){
    console.log("CALLBACK!");
    res.end();
});

//                      500 Error
// - - - - - - - - - - - - - - - - - - - - - - - - - - -
app.get('/500', function(req, res, next){
    next(new Error('keyboard cat!'));
});


app.listen('8000');
console.log('Express server started on port %s', app.address().port);


// - - - - - - - - - - - - - - - - - - - - - - - - - - 
//                 socket.io 
// - - - - - - - - - - - - - - - - - - - - - - - - - - 
var socket = io.listen(app); 
socket.on('connection', function(client){ 
  client.on('message', function(commands){ 
    _.each(commands,function(action, command){
      if (command == 'ping') {
        // Set things up
        var buffer = [],
        ip,
        exec = require('child_process').exec,
        ping;
        
        // Load up the servers IP
        _.each(serversConfig,function(server){
          if (ip == null && server.name == action) {
            if (server.ip) {
              ip = server.ip;
            } else {
              //TODO: Throw a proper error
            };
          }
        })
        // It's time to ping!
        //var ping = spawn('ping ' + ip );
        //ping.stdout.on('data', function (data) {
        //  console.log('stdout: ' + data);
        //});
        
        //ping.stderr.on('data', function (data) {
        //  console.log('stderr: ' + data);
        //});
        
        //ping.on('exit', function (code) {
        //  console.log('child process exited with code ' + code);
        //});
        console.log("pinging: "+ ip);
        //ping = exec('ping ' + ip, 
        //  function (error, stdout, stderr) {
        //    console.log('stdout: ' + stdout);
        //    console.log('stderr: ' + stderr);
        //    if (error !== null) {
        //      console.log('exec error: ' + error);
        //    }
        //});
        
        // Stop this
        //setTimeout(ping.kill(),1000)
        //
      }
      
    });
  });
  
  client.on('disconnect', function(){
    console.log('socket.io: DISCONNECTED!')
  }) 
  
});
