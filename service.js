

exports.load = function(req, res, next) {
  var site = null;
  _.each(req.config,function(server){
    if (site == null)
      site = _.detect(server.sites, function(s){ return s.id == req.params.id })
  })
  if (site) {
    req.site = site;
    next();
  } else {
    next(new Error('Failed to load site ' + req.params.site));
  }
};

exports.check = function(req, res){
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
};