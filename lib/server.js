

module.exports = function(app, sq){
  var _ = require('underscore')
    , currentServer
    
    
  //                      PARAMETERS
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  app.param('server', function(req, res, next, id){
    sq.Server.findById(id, function(err, server) {
      if (err) return next(err)
      if (!server) return next(new Error('failed to find server'))
      req.server = server
      next()
    })
  })
  
  app.param('service', function(req, res, next, id){
    if (req.server) {
      req.service = req.server.services.id(id)
    }
    next()
  })
  
  //                      Routes
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  app.get( '/',                                 homePage )
  app.get( '/server/new',                       sq.isAuth, createServerForm )
  app.post('/server/new',                       sq.isAuth, createServer )
  app.get( '/server/lookup/:ip',                lookupServer )
  app.get( '/server/:server.:format?',          sq.isAuth, showServerByID )
  app.get( '/tag/:tag',                         sq.isAuth, showServerByTag )
  app.get( '/server/:server/edit',              sq.isAuth, editServer ) 
  app.put( '/server/:server',                   sq.isAuth, updateServer )
  app.del( '/server/:server',                   sq.isAuth, deleteServer )
  
  app.get( '/check?',                           checkServers )
  app.get( '/server/:server/check',             checkServer )
  app.get( '/server/:server/status',            showServerStatus )
  app.get( '/server/:server/service/:service',  showServiceByID )

  
  //                      Utilities
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function removeThe(w) {
    return (w.indexOf("the ") !== -1)? w.substr(4) : w
  }
  function sortServers(s1, s2) {
    var x = removeThe(s1["name"].toLowerCase())
    var y = removeThe(s2["name"].toLowerCase())
    return ((x < y) ? -1 : ((x > y) ? 1 : 0))
  }
  function responseStatus(statusCode) {
    if (statusCode >= 300 && statusCode < 400) 
      return "warning"
    else if (statusCode >= 400) 
     return "error"
    else 
      return "ok"
  }
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //                      Route Logic
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  //                      Homepage
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function homePage(req, res){
    if (req.session.auth && req.session.auth.loggedIn) {
      sq.Server.find({user : req.session.auth.userId}).sort('name', 1 ).run(function (err, servers) {
        var list = {}
            list.production = _.select(servers, function(server){ return _.include(server.type, "production") })
          , list.development = _.select(servers, function(server){ return _.include(server.type, "development") })
          , list.other = _.reject(servers, function(server){
                            return _.any(server.type, function(type){
                                      return (type == "development" || type == "production")
                            })
                        })
        res.render('server/index', {
          title: "Dashboard",
          servers: list
        })
      })
    } else {
      sq.Server.find({ 'services.public' : true }, function (err, servers) {
        var publicServices = []
        _.each(servers, function(server){
          publicServices.push(_.select(server.services, function(service){ return service.public == true}))
        })
        publicServices = _.flatten(publicServices)
        publicServices = publicServices.sort(sortServers)
        res.render('service', {
          title: "Dashboard",
          services: publicServices
        })
      })
    }
  }
  
  //                  Create Server Form
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function createServerForm(req, res){
    // Setup the new server
    var server = new sq.Server()
    server.services.push({ name:'Ping', type: 'ping', public:true })
    
    res.render('server/new', {
      server: server
    });
  }
  
  //                  POST new server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function createServer(req, res){
    var server = new sq.Server({
        name    : req.body.server.name
      , type    : req.body.server.type
      , ip      : req.body.server.ip
      , os      : req.body.server.os
      , user    : req.session.auth.userId
    })
    for (var i=0; i < _.size(req.body.server.services); i++) {
      if (req.body.server.services[i]['delete'] === "true") {
          delete req.body.server.services[i]
      }
      else {
        server.services.push(req.body.server.services[i])
      }
    }
    
    server.save(function(err){
      if (!err) {
        checkServerServices(server, function(){
          res.redirect('/')
        })
        req.flash('success', 'You\'re server has been created')
      } else {
        req.flash('error', 'Err, Something broke when we tried to save your server. Sorry!')
        console.log("Mongoose ERROR:" + err)
        res.redirect('/')
      }
      
    });
  }
  
  //                  Show Server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function showServerByID(req, res){
    if (req.params.format === 'json')
      res.send(req.server.toObject())
    else if (req.xhr)
      res.partial('server/show', {server: req.server})
    else
      res.render('server/show', {server: req.server})
  }
  
  //              Show filtered server list
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function showServerByTag(req, res){
    sq.Server.find({}, {type:1}, function(err, servers) {
      if (err) return next(err);
      var tags = _.select(_.uniq(_.flatten(_.pluck(servers,'type')).sort(), true), function(word){
        return (word.indexOf(req.params.tag) != -1)?true:false
      })
      res.send(tags)
    });
  }
  
  //                 Show edit server list
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -  
  function editServer(req, res){
    res.render('server/edit', {server: req.server})
  }
  
  //                      PUT Server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function updateServer(req, res, next){
    var server = req.server
      , serviceChanges = []
      , s = req.body.server
    
    if(!server) return next(new Error('That server disappeared!'))
    
    // Lighten the code load
    server.updated = new Date();
    server.ip = s.ip
    server.name = s.name
    server.os = s.os
    server.type = s.type
    
    for (var num = _.size(s.services) - 1; num >= 0; num--){
      var ss = s.services[num] //Even more now (ligtening the code)!
      
      if (ss.id && server.services.id(ss.id)) {
        if (ss.delete === "true") {
          serviceChanges.push({server: server.id, action: "delete", service: ss.id})
        } else {
          server.services.id(ss.id).type = ss.type
          server.services.id(ss.id).name = ss.name
          server.services.id(ss.id).url = ss.url
          server.services.id(ss.id).public = (ss.public) ? true:false
        }
      } else {
        serviceChanges.push({server: server.id, action: "add", service: ss})
      }
    }
    server.save(function(err){
      if (!err) {
        req.flash('success', 'Server updated')
        // We need to sepereate out the adding and removing of services 
        // to avoid Mongo's conflicting modification errors
        sq.lib.async.forEachSeries(serviceChanges, updateService, function(err){
          checkServerServices(server, function(){
            res.redirect('/')
          })
          
        })
      } else {
        req.flash('error', 'The changes to your sever could not be made because they "'+err.message+'"')
        sq.debug(err, "Server Put Error")
        res.redirect('/')
      }
    });
  }
  
  //                    Update Services 
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function updateService(s, fn) {
    sq.Server.findById(s.server, function(err, server) {
      if (err) return next(err)
      
      if (s.action == "add")
        server.services.push(s.service)
      
      if (s.action == "delete")
        server.services.id(s.service).remove()
      
      server.save(fn(err))
    })
  }
  
  //                  Delete a server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function deleteServer(req, res, next){
    if(!req.server) return next(new NotFound('That server disappeared!'));
    
    sq.ServiceReponse.remove({serverID:req.server.id}, function(err) {
      if (err) sq.debug(err, "Server Delete service log Error")
    })
    
    req.server.remove(function(err){
      if (!err) {
        req.flash('success', 'Server removed')
      } else {
        req.flash('error', 'Err, Something broke when we tried to delete your server. Sorry!')
        sq.debug(err, "Server Delete Error")
      }
      res.redirect('/')
    });
  }
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //                      Services Logic
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  //                Check all of a users servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function checkServers(req, res){ //4dbb1ef58797f3e47f000001
    sq.Server.find({user:req.query.user}, function(err, servers){
      sq.lib.async.forEachSeries(servers, checkServerServices, function(err, serversReponse){
        res.send("DONE")
      })    
    })
  }
  
  //             GET: Check the services of a server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function checkServer(req, res) {
    checkServerServices(req.server, function(){
      showServerStatus(req, res)
    })
  }
  
  //                   Lookup Server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function lookupServer(req, res){
    require('dns').reverse(req.params.ip, function(err, domains){
      if (err) domains = []
      res.send(domains)
    })
  }
  //        Iterate through each service of a server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function checkServerServices(server, fn){
    sq.debug('- Checking server: '+server.name)
    
    currentServer = server
    
    sq.lib.async.map(server.services, checkService, function(err, serviceResponses){
      _.each(serviceResponses, function(serviceResponse, key){
        serviceResponse.serverID = server._id
        // Update the lastStatus value for the service for easy access later. Also, put ok to uppercase....cause it lookes nicer
        server.services[key].lastStatus = (serviceResponse.responseStatus === 'ok')?'OK':serviceResponse.responseStatus;
        server.services[key].lastStatusTime = new Date()
        serviceResponse.save(function(err){
          if (err) {
            new Error('Couldnt save the serviceResponse')
            console.log(err)
          } 
        });
      })
      server.save(function(err){
        if (err) {
          new Error('Updating server status failed')
          console.log(err)
        }
        
        fn()
      });
    })
    
    currentServer = null
  }
  
  //                Check an individual service
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function checkService(service, fn) {
    var sr
    
    sq.debug('\t-: '+service.name)
    
    switch (service.type) {
      // HTTP Service Check
      case 'http':
        sq.lib.request({uri:service.url, onResponse:true}, function (error, response, body) {
          if (error) {
            var response = {}
            response.statusCode = 500
          }
          sr = new sq.ServiceReponse({
              serviceID       :  service._id
            , type            :  service.type
            , responseStatus  :  responseStatus(response.statusCode)
            , responseCode    :  response.statusCode
            , responseMessage :  (error)?error.message.substr(error.message.indexOf(',')+2):sq.lib.HTTPStatus[response.statusCode]
          })
          fn(null, sr)
        })
      break;
      // Ping Service check
      case 'ping':
      default:
        var exec = require('child_process').exec
          , ping;
        ping = exec('ping -qc 3 '+currentServer.ip,
          function (error, stdout, stderr) {
            if (error !== null) console.log('exec error: ' + error)

            //PING 172.30.10.29 (172.30.10.29): 56 data bytes
            //
            //--- 172.30.10.29 ping statistics ---
            //3 packets transmitted, 3 packets received, 0.0% packet loss
            //round-trip min/avg/max/stddev = 0.497/0.575/0.626/0.056 ms
            var pattern = /.+received, (.+?)%.+\n.+\= (.+?)\/(.+?)\/(.+?)\/.+/gi
            var p = pattern.exec(stdout)
            // Split out stdout
            sr = new sq.ServiceReponse({
                serviceID       :  service._id
              , type            :  service.type
              , responseStatus  :  (p[1]=='0.0')?"OK":(p[1]=='100.0'?'error':'warning')
              , pingPacketLoss  :  p[1]
              , pingTimeMin     :  p[2]
              , pingTimeMax     :  p[3]
              , pingTimeAvg     :  p[4]
            })
            fn(null, sr)
        });
    }
  }
  
  //          Retrieve the simple status of a server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function showServerStatus(req, res){
    var result = {
        ok: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'OK' }))
      , warning: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'warning' }))
      , error: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'error' }))
    }
    res.send(result)
  }

  //        Initiate an individual service check
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function showServiceByID(req, res){
    checkService(req.service, function(err, result){
      res.send(result)
    })
  }
  
  //        Pinging a Server
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  
  function killPingServer(socket_id){
    sq.debug("\t- Attempting to kill ping for "+socket_id)
    if (sq.jobs[socket_id] && sq.jobs[socket_id].ping) sq.jobs[socket_id].ping.kill()
  }
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - -
  //                 socket.io
  // - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  sq.io.sockets.on('connection', function(socket){
    
    sq.jobs[socket.id] = {}
    
    socket.on('ping', function(ip, fn){
      var ping
        , buffer = []
        , pattern = /(\d+?) bytes from (.+?): icmp_.{3}=(\d+?) ttl=(\d+?) time=(.+) ms/ // Mac Output
        , output
      // If is a prerunning ping for this particular socket session, kill it off
      if (sq.jobs[socket.id].ping)
        killPingServer(socket.id)
      
      sq.debug("\t- Pinging Server "+ip)
      // Set things up
      var ping
    
      // Spawn the ping child process
      ping = sq.jobs[socket.id].ping = sq.lib.spawn('ping', [ip])
    
      if (ping) {
        fn(true)
      }
      else
        fn(false)
        
      ping.stdout.on('data', function (data) {
        data = data.toString().slice(0,-1)
        var regexOutput = pattern.exec(data)
        output = (regexOutput) ? {bytes_sent:regexOutput[1], ip: regexOutput[2], icmp_req: regexOutput[3], ttl: regexOutput[4], time: regexOutput[5]} : {}
        socket.json.emit('ping-response', output)
      });

      ping.stderr.on('data', function (data) {
        console.log('stderr: ' + data);
      });

      ping.on('exit', function (code) {
        console.log('\t- child process exited with code ' + code);
      });
    })
    
    socket.on('ping-kill', function(){
      sq.debug("\t- Kill ping request sent")
      killPingServer(socket.id)
    })
    
    socket.on('disconnect', function () {
      killPingServer(socket.id)
      delete sq.jobs[socket.id]
    });
  });
};
