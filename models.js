var User;

exports.defineModels = function(mongoose, fn) {
  var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId;

  //            Users
  // - - - - - - - - - - - - - - - - - - - 
  var User = new Schema({
      user_id       : ObjectId
    , created       : { type: Date, default: Date.now }
    , lastLoggedIn  : { type: Date, default: Date.now }
    , username      : { type: String, index: { unique: true } }
    , name          : { type: String, match: /[a-z]/ }
    , email         : { type: String, index: { unique: true } }
    , picture       : String
    , access_token  : String
    , access_token_secret: String
  });
    
  mongoose.model('User', User);
  
  fn();
}