exports.dynamicHelpers = {
  body_classes: function(req, res) {
    var path = require('url').parse(req.url).pathname;
    if (path == '/')
      return 'front'
    else {
      classes = path.substr(1).split('/');
      classes[0] = 'type-' + classes[0];
      if (classes[1] && classes[1] != 'new') 
        classes[1] = 'service'+classes[1];
      classes.push('page');
      return classes.join(' ');
    }
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