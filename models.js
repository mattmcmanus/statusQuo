var User;

exports.defineModels = function(mongoose, fn) {
  var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;
  
  function validatePresenceOf(value) {
    return value && value.length;
  }
  //            Users
  // - - - - - - - - - - - - - - - - - - - 
  var User = new Schema({
      user_id       : ObjectId
    , created       : { type: Date, default: Date.now }
    , lastLoggedIn  : { type: Date, default: Date.now }
    , username      : { type: String, index: { unique: true } }
    , name          : { type: String, match: /[a-z]/ }
    , email         : { type: String, match: /[A-Z0-9._%+-]+@(?:[A-Z0-9-]+\.)+[A-Z]{2,4}/, validate: [validatePresenceOf, 'an email is required'], index: { unique: true } }
    , picture       : String
    , access_token  : String
    , access_token_secret: String
  });
    
  mongoose.model('User', User);
  
  fn();
}