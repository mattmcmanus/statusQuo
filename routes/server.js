

module.exports = function(app, sq){
  var _ = require('underscore')
    , Schema = sq.lib.mongoose.Schema
    , ObjectId = sq.lib.mongoose.SchemaTypes.ObjectId
    , mongoose = sq.lib.mongoose
    
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
  app.get( '/server/new',                       sq.isAuthenticated, createServerForm )
  app.post('/server/new',                       createServer )
  app.get( '/server/lookup/:ip',                lookupServer )
  app.get( '/server/:server.:format?',          showServerByID )
  app.get( '/tag/:tag',                         sq.isAuthenticated, showServerByTag )
  app.get( '/server/:server/edit',              sq.isAuthenticated, editServer ) 
  app.put( '/server/:server',                   updateServer )
  app.del( '/server/:server',                   deleteServer )
  
  app.get( '/check?',                           checkServers )
  app.get( '/server/:server/check',             checkServer )
  app.get( '/server/:server/status',            showServerStatus )
  app.get( '/server/:server/service/:service',  showServiceByID )

  
  
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ServiceSchema = new sq.lib.mongoose.Schema({
      name            :  String
    , type            :  { type: String, index: true }
    , url             :  String
    , public          :  { type: Boolean, index: true }
    , lastStatus      :  String
    , lastStatusTime  :  Date
  })

  ServiceSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  ServiceSchema.virtual('hostname')
    .get(function() {
      return require('url').parse(this.url).hostname
    })
  ServiceSchema.virtual('lastStatusTimeRelative')
    .get(function() {
      return sq.lib._date(this.lastStatusTime).fromNow()
    })


  //                          Servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ServerSchema = new sq.lib.mongoose.Schema({
      user         :  { type: ObjectId, index: true }
    , created      :  { type: Date, default: Date.now }
    , updated      :  { type: Date, default: Date.now }
    , ip           :  { type: String, index: { unique: true } }
    , name         :  String
    , os           :  String
    , type         :  { type: [String], set: splitTags}
    , services     :  [ServiceSchema]
  })

  function splitTags(tags) {
    tags = tags[0].split(',')
    _.each(tags, function(tag, key){
      if (tag == ' ') tags.splice(key,1)
      else
        tags[key] = tag.toLowerCase().replace(/^\s+|\s+$/g,"")
    })
    return tags
  }

  ServerSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  //                     Status Log
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ServiceResponseSchema = new sq.lib.mongoose.Schema({
      serverID        :  { type: ObjectId, index: true }
    , serviceID       :  { type: ObjectId, index: true }
    , timestamp       :  { type: Date, default: Date.now }
    , type            :  { type: String, index: true }
    , responseStatus  :  { type: String, index: true } //OK, warning, error
    , responseCode    :  String
    , responseMessage :  String
    , responseTime    :  String
  })

  ServiceResponseSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  sq.lib.mongoose.model( 'Server', ServerSchema )
  sq.lib.mongoose.model( 'Service', ServiceSchema )
  sq.Server = sq.lib.mongoose.model('Server')
  
  sq.lib.mongoose.model( 'ServiceResponse', ServiceResponseSchema )
  sq.ServiceReponse = sq.lib.mongoose.model('ServiceResponse')
  
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
  function updateModified(origVal, newVal) {
    if (origVal !== newVal) origVal = newVal
  }
  function responseStatus(statusCode) {
    if (statusCode >= 300 && statusCode < 400) 
      return "warning"
    else if (statusCode >= 400) 
     return "error"
    else 
      return "ok"
  }
  
  //                      Route Logic
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function homePage(req, res){
    sq.debug(req.user, "req.user")
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
  
  function createServerForm(req, res){
    res.render('server/new', {
      server: new Server()
    });
  }
  
  function createServer(req, res){
    var server = new Server({
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
        delete req.body.server.services[i]['delete']
        server.services.push(req.body.server.services[i])
      }
    }
    
    server.save(function(err){
      if (!err) {
        ServerCheck(server)
        req.flash('success', 'You\'re server has been created')
      } else {
        req.flash('error', 'Err, Something broke when we tried to save your server. Sorry!')
        console.log("Mongoose ERROR:" + err)
      }
      res.redirect('/')
    });
  }
  
  function lookupServer(req, res){
    require('dns').reverse(req.params.ip, function(err, domains){
      if (err) domains = []
      res.send(domains)
    })
  }
  
  function showServerByID(req, res){
    _.each(req.server.type, function(type, key){ req.server.type[key] = '<span class="type '+type+'">'+type+'</span>' })
    req.server.type = req.server.type.join('')
    
    if (req.params.format === 'json')
      res.send(req.server.toObject())
    else if (req.xhr)
      res.partial('server/show', {server: req.server})
    else
      res.render('server/show', {server: req.server})
  }
  
  function showServerByTag(req, res){
    Server.find({}, {type:1}, function(err, servers) {
      if (err) return next(err);
      var tags = _.select(_.uniq(_.flatten(_.pluck(servers,'type')).sort(), true), function(word){
        return (word.indexOf(req.params.tag) != -1)?true:false
      })
      res.send(tags)
    });
  }
    
  function editServer(req, res){
    res.render('server/edit', {server: req.server})
  }
  
  function updateServer(req, res, next){
    if(!req.server) return next(new Error('That server disappeared!'))
    
    // Lighten the code load
    var s = req.body.server
    
    req.server.updated = new Date();
    req.server.ip = s.ip
    req.server.name = s.name
    req.server.os = s.os
    req.server.type = s.type
    
    for (var num = _.size(s.services) - 1; num >= 0; num--){
      var ss = s.services[num] //Even more now (ligtening the code)!
      
      if (ss.id && req.server.services.id(ss.id)) {
        if (ss.delete === "true") {
          req.server.services.id(ss.id).remove()
        } else {
          updateModified(req.server.services.id(ss.id).type, ss.type)
          updateModified(req.server.services.id(ss.id).name, ss.name)
          updateModified(req.server.services.id(ss.id).url, ss.url)
          updateModified(req.server.services.id(ss.id).public, (ss.public) ? true:false)
        }
      } else {
        delete ss["delete"]
        req.server.services.push(ss);
      }
    }
    
    req.server.save(function(err){
      if (!err) {
        req.flash('success', 'Server updated')
        serverCheck(req.server)
      } else {
        req.flash('error', 'The changes to your sever could not be made because they "'+err.message+'"')
        sq.debug(err, "Server Put Error")
      }
      res.redirect('/')
    });
  }
  
  function deleteServer(req, res, next){
    if(!req.server) return next(new NotFound('That server disappeared!'));
    
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
  
  //                      Services Logic
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function checkServers(req, res){ //4dbb1ef58797f3e47f000001
    Server.find({user:req.query.user}, function(err, servers){
      _.each(servers, function(server){
        serverCheck(server)
      })
      res.send()
    })
  }
  
  function checkServer(req, res) {
    sq.lib.async.map(req.server.services, checkService, function(err, serviceResponses){
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
          new Error('Updated server')
          console.log(err)
        }
      });
    })
  }
  
  function checkService(service, fn) {
    sq.lib.request({uri:service.url, onResponse:true}, function (error, response, body) {
      if (error) {
        var response = {}
        response.statusCode = 500
      }
      var sr = new sq.ServiceResponse({
          serviceID       :  service._id
        , type            :  service.type
        , responseStatus  :  responseStatus(response.statusCode)
        , responseCode    :  response.statusCode
        , responseMessage :  (error)?error.message.substr(error.message.indexOf(',')+2):lib.HTTPStatus[response.statusCode]
      })
      fn(null, sr)
    })
  }
  
  function showServerStatus(req, res){
    var result = {
        ok: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'OK' }))
      , warning: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'warning' }))
      , error: _.size(_.select(req.server.services, function(service){return service.lastStatus == 'error' }))
    }
    res.send(result)
  }
  
  function showServiceByID(req, res){
    checkService(req.service, function(err, result){
      res.send(result)
    })
  }
};