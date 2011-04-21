var _ = require('underscore')

// Define models
exports.defineModels = function(mongoose, fn) {
  var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId
    , User
    , LoginToken
    , Server
    , Services

  //                          Users
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  User = new Schema({
      user_id       :  ObjectId
    , created       :  { type: Date, default: Date.now }
    , lastLoggedIn  :  { type: Date, default: Date.now }
    , username      :  { type: String, index: { unique: true } }
    , name          :  { type: String, match: /[a-z]/ }
    , email         :  { type: String, index: { unique: true } }
    , picture       :  String
    , access_token  :  String
    , access_token_secret: String
  });
  
  User.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });
  
  //                     LoginToken
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  LoginToken = new Schema({
    email: { type: String, index: true },
    series: { type: String, index: true },
    token: { type: String, index: true }
  });

  LoginToken.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + '';
  });

  LoginToken.pre('save', function(next) {
    // Automatically create the tokens
    this.token = this.randomToken();

    if (this.isNew)
      this.series = this.randomToken();

    next();
  });

  LoginToken.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });

  LoginToken.virtual('cookieValue')
    .get(function() {
      return JSON.stringify({ email: this.email, token: this.token, series: this.series });
    });  
    
    
  
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  Services = new Schema({
      name        :  String
    , url         :  { type: String, index: true }
    //, port        :  { type: Number, default: 80}
  })
  
  Services.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });
  
  
  //                          Servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  Server = new Schema({
      server_id       :  ObjectId
    , user         :  { type: String, index: true }
    , created         :  { type: Date, default: Date.now }
    , updated         :  { type: Date, default: Date.now }
    , ip              :  { type: String, index: { unique: true } }
    , name            :  String
    , os              :  String
    , type            :  { type: [String], set: splitTags}
    , public          :  { type: Boolean, index: true }
    , services        :  [Services] 
  })
  
  function splitTags(tags) {
    tags = tags[0].split(',')
    _.each(tags, function(tag, key){
      if (tag == ' ') tags.splice(key,1)
      else
        tags[key] = tag.toLowerCase().replace(/^\s+|\s+$/g,"")
    })
    console.log(tags)
    return tags
  }
  
  Server.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });
  
  
  
  mongoose.model('User', User);
  mongoose.model('Server', Server);
  mongoose.model('LoginToken', LoginToken);
  
  fn();
}