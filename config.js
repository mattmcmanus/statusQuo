module.exports = function(app,express) {
  var NODE_ENV = global.process.env.NODE_ENV || 'development';
  app.set('environment', NODE_ENV);

  // Set some global defaults
  app.set("view engine"         , "jade")
  app.set("restrictUser"        , "auitstatus")
  app.set("myHostname"          , "http://local.host:8000")
  app.set("oauthConsumerKey"    , "1oIbL79bytbvNVvsz0lSfA")
  app.set("oauthConsumerSecret" , "aBOwq9igEaLiyXJDh0xZHzZeVl8dtjsk1TfGQKI3BA")  
  
  app.configure('development', function() {
    app.set('db-uri', 'mongodb://localhost/sq_dev')
    app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
  })
  
  app.configure('production', function() {
    app.set('db-uri', 'mongodb://localhost/statusquo-prod')
    app.use(express.errorHandler());
  })
}