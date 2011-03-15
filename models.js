var User;

exports.defineModels = function(mongoose, fn) {
  var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

  //                          Users
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var User = new Schema({
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
    
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var Services = new Schema({
      name              :  String
    , type              :  String
    , url               :  String
    , port              :  { type: Number, default: 80}
  })
  
  Services.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });
  
  
  //                          Servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var Server = new Schema({
      server_id       :  ObjectId
    , user_id         :  ObjectId
    , created         :  { type: Date, default: Date.now }
    , updated         :  { type: Date, default: Date.now }
    , ip              :  { type: String, index: { unique: true } }
    , name            :  String
    , os              :  String
    , type            :  [String]
    , services        :  [Services] 
  })
  
  Server.virtual('id')
    .get(function() {
      return this._id.toHexString();
    });
  
  
  mongoose.model('User', User);
  mongoose.model('Server', Server);
  
  fn();
}