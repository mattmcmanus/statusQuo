var http = require('http')
	fs = require('fs');

require('./lib/underscore.js')

// Haml-js: http://github.com/creationix/haml-js
var haml = require('./lib/haml-js/lib/haml');

//Read the config file
var serversConfig = JSON.parse(fs.readFileSync('./config.js', 'utf8'));
_.each(serversConfig, function(singleServer){ 
  _.each(singleServer.sites, function(site, key){
    site.statusCode = checkSite(site.url);
	});
});


var actions = [];

actions.push({
  path: "/",
  template: "index.haml",
  view: {}
})

function checkSite(url) {
  var site = http.createClient(80, url);
  var request = site.request('GET', '/',
    {'host': url});
  request.end();
  request.on('response', function (response) {
    return response.statusCode;
  });
}

var server = http.createServer(function (req, res) {
  var action = _(actions).chain().select(function(a) { return req.url == a.path }).first().value()
	if (_.isEmpty(action)) {
    res.writeHead(404, {'Content-Type': 'text/plain'})
    res.end("Error!")
  } else {
    //var template = fs.readFileSync('./templates/'+action.template, 'utf8');
    var data = {
  	  "servers": serversConfig
  	};
  	var html = haml.render(fs.readFileSync('./templates/'+action.template, 'utf8'), {locals: data});
  	res.writeHead(200, {'Content-Type': 'text/html'})
  	res.end(html);
  }
	
}).listen(8000);

// socket.io 
//var socket = io.listen(server); 
//socket.on('connection', function(client){ 
//  // new client is here! 
//  client.on('message', function(){ … }) 
//  client.on('disconnect', function(){ … }) 
//});
console.log('Server running at http://localhost:8000/');