require('./lib/underscore.js')

var fs = require('fs'),
    express = require('express'),
    app = express.createServer();

//Read the config file
var serversConfig = JSON.parse(fs.readFileSync('./config.js', 'utf8'));
//_.each(serversConfig, function(singleServer){ 
//  _.each(singleServer.sites, function(site, key){
//    site.statusCode = checkSite(site.url);
//	});
//});
app.set('views', __dirname + '/views');
app.set('view engine', 'haml');
app.set('view options', {layout: false});

app.get('/', function(req, res){
  res.render('index',{
        locals: {
            servers: serversConfig
        }
    })
});

app.listen('8000');
console.log('Express server started on port %s', app.address().port);





function checkSite(url) {
  var site = http.createClient(80, url);
  var request = site.request('GET', '/',
    {'host': url});
  request.end();
  request.on('response', function (response) {
    return response.statusCode;
  });
}

// socket.io 
//var socket = io.listen(server); 
//socket.on('connection', function(client){ 
//  // new client is here! 
//  client.on('message', function(){ … }) 
//  client.on('disconnect', function(){ … }) 
//});
