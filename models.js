var _ = require('underscore')
    everyauth = require('everyauth')
  , Promise = everyauth.Promise
  , mongooseAuth = require('mongoose-auth')

// Define models
exports.defineModels = function(mongoose, settings, fn) {
  var Schema = mongoose.Schema
    , ObjectId = Schema.ObjectId
    , UserSchema
    , LoginToken
    , Server
    , Services
    , Log

  //                          Users
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  UserSchema = new Schema({
      created       :  { type: Date, default: Date.now }
    , lastLoggedIn  :  { type: Date, default: Date.now }
    , username      :  { type: String, index: { unique: true } }
    , name          :  { type: String, match: /[a-z]/ }
    , email         :  { type: String, index: { unique: true } }
    , picture       :  String
  })
  
  UserSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  //                     LoginToken
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  LoginToken = new Schema({
      email   : { type: String, index: true }
    , series  : { type: String, index: true }
    , token   : { type: String, index: true }
  })

  LoginToken.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  })

  LoginToken.pre('save', function(next) {
    // Automatically create the tokens
    this.token = this.randomToken()

    if (this.isNew)
      this.series = this.randomToken()

    next()
  })

  LoginToken.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  LoginToken.virtual('cookieValue')
    .get(function() {
      return JSON.stringify({ email: this.email, token: this.token, series: this.series })
    })  
    
  
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  Services = new Schema({
      name        :  String
    , type        :  { type: String, index: true }
    , url         :  String
    , public      :  { type: Boolean, index: true }
    , lastStatus  :  String
    //, port        :  { type: Number, default: 80}
  })
  
  Services.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  
  
  //                          Servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  Server = new Schema({
      user         :  { type: ObjectId, index: true }
    , created      :  { type: Date, default: Date.now }
    , updated      :  { type: Date, default: Date.now }
    , ip           :  { type: String, index: { unique: true } }
    , name         :  String
    , os           :  String
    , type         :  { type: [String], set: splitTags}
    , services     :  [Services] 
  })
  
  function splitTags(tags) {
    tags = tags[0].split(',')
    _.each(tags, function(tag, key){
      if (tag == ' ') tags.splice(key,1)
      else
        tags[key] = tag.toLowerCase().replace(/^\s+|\s+$/g,"")
    })
    return tags
  }
  
  Server.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
    
  //                     Status Log
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  ServiceResponse = new Schema({
      serverID        :  { type: ObjectId, index: true }
    , serviceID       :  { type: ObjectId, index: true }
    , timestamp       :  { type: Date, default: Date.now }
    , type            :  { type: String, index: true }
    , responseStatus    :  { type: String, index: true } //OK, warning, error
    , responseCode    :  String
    , responseMessage :  String
    , responseTime    :  String
  })
  
  ServiceResponse.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
    
  
  mongoose.model('User', UserSchema)
  mongoose.model('Server', Server)
  mongoose.model('LoginToken', LoginToken)
  mongoose.model('ServiceResponse', ServiceResponse)
  
  fn()
}