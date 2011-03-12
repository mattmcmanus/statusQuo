exports.helpers = {
  serviceCounter: 0
}

exports.dynamicHelpers = {
  body_classes: function(req, res) {
    var classes = []
      , path = require('url').parse(req.url).pathname;
    if (path == '/')
      classes.push('front');
    else {
      classes = path.substr(1).split('/');
      classes[0] = 'type-' + classes[0];
      classes.push('page');
    }
    classes.push((req.session.user)?'logged-in':'not-logged-in');
    
    return classes.join(' ');
  },
  
  session: function(req,res) {
    return req.session;
  },
  
  page: function(req, res){
    return req.url;
  },
  
  messages: function(req, res){
    var buf = []
      , messages = req.flash()
      , types = Object.keys(messages)
      , len = types.length;
    if (!len) return '';
    buf.push('<div id="messages">');
    
    for (var i = 0; i < len; ++i) {
      var type = types[i]
        , msgs = messages[type];
      if (msgs) {
        buf.push('  <ul class="' + type + '">');
        for (var j = 0, len = msgs.length; j < len; ++j) {
          var msg = msgs[j];
          buf.push('    <li>' + msg + '</li>');
        }
        buf.push('  </ul>');
      }
    }
    buf.push('</div>');
    return buf.join('\n');
  }
};