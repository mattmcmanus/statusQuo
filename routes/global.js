var xml = require("node-xml");


exports.isAuthenticated = function(req, res, next) {
  if (req.session && req.session.user) {
    next()
  } else {
    req.flash('warning', 'You need to be logged in to see that page')
    res.render('page', {
      title: "You've tried to access a restricted page",
      body: "<a href=\"/login\">Please sign in</a>"
    })
  }  
}

exports.parseXML = function(data){
  var parser = new xml.SaxParser(function(cb) {
    cb.onStartDocument(function() {
  
    });
    cb.onEndDocument(function() {
  
    });
    cb.onStartElementNS(function(elem, attrs, prefix, uri, namespaces) {
        //sys.puts("=> Started: " + elem + " uri="+uri +" (Attributes: " + JSON.stringify(attrs) + " )");
    });
    cb.onEndElementNS(function(elem, prefix, uri) {
        //sys.puts("<= End: " + elem + " uri="+uri + "\n");
        //   parser.pause();// pause the parser
        //   setTimeout(function (){parser.resume();}, 200); //resume the parser
    });
    cb.onCharacters(function(chars) {
        //sys.puts('<CHARS>'+chars+"</CHARS>");
    });
    cb.onCdata(function(cdata) {
        sys.puts('<CDATA>'+cdata+"</CDATA>");
    });
    cb.onComment(function(msg) {
        sys.puts('<COMMENT>'+msg+"</COMMENT>");
    });
    cb.onWarning(function(msg) {
        sys.puts('<WARNING>'+msg+"</WARNING>");
    });
    cb.onError(function(msg) {
        sys.puts('<ERROR>'+JSON.stringify(msg)+"</ERROR>");
    });
  });
  
  return parser.parseString(data);
}