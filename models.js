var _ = require('underscore')
  , _date = require('underscore.date')
  , everyauth = require('everyauth')
  , Promise = everyauth.Promise
  , mongooseAuth = require('mongoose-auth')
  , fs = require('fs')

everyauth.debug = true

// Define models
exports.defineModels = function(mongoose, settings, fn) {
  var Schema = mongoose.Schema
    , ObjectId = mongoose.SchemaTypes.ObjectId

  //                          Users
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var UserSchema = new Schema({
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
    
  UserSchema.plugin(mongooseAuth, {
      everymodule: {
        everyauth: {
            User: function () {
              return User;
            }
        }
      }
    , twitter: {
        everyauth: {
            myHostname: 'http://util.it.arcadia.edu:8000'
          , consumerKey: settings.defaults.oauthConsumerKey
          , consumerSecret: settings.defaults.oauthConsumerSecret
          , authorizePath: '/oauth/authenticate'
          , redirectPath: '/'
        }
      }
  });
  //                     LoginToken
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var LoginTokenSchema = new Schema({
      email   : { type: String, index: true }
    , series  : { type: String, index: true }
    , token   : { type: String, index: true }
  })

  LoginTokenSchema.method('randomToken', function() {
    return Math.round((new Date().valueOf() * Math.random())) + ''
  })

  LoginTokenSchema.pre('save', function(next) {
    // Automatically create the tokens
    this.token = this.randomToken()

    if (this.isNew)
      this.series = this.randomToken()

    next()
  })

  LoginTokenSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  LoginTokenSchema.virtual('cookieValue')
    .get(function() {
      return JSON.stringify({ email: this.email, token: this.token, series: this.series })
    })  
    
  
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var ServicesSchema = new Schema({
      name            :  String
    , type            :  { type: String, index: true }
    , url             :  String
    , public          :  { type: Boolean, index: true }
    , lastStatus      :  String
    , lastStatusTime  :  Date
    //, port        :  { type: Number, default: 80}
  })
  
  ServicesSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  ServicesSchema.virtual('hostname')
    .get(function() {
      return require('url').parse(this.url).hostname
    })
  ServicesSchema.virtual('lastStatusTimeRelative')
    .get(function() {
      return _date.date(this.lastStatusTime).fromNow()
    })
  
  
  //                          Servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var ServerSchema = new Schema({
      user         :  { type: ObjectId, index: true }
    , created      :  { type: Date, default: Date.now }
    , updated      :  { type: Date, default: Date.now }
    , ip           :  { type: String, index: { unique: true } }
    , name         :  String
    , os           :  String
    , type         :  { type: [String], set: splitTags}
    , services     :  [ServicesSchema] 
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
  
  ServerSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
    
  //                     Status Log
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - 
  var ServiceResponseSchema = new Schema({
      serverID        :  { type: ObjectId, index: true }
    , serviceID       :  { type: ObjectId, index: true }
    , timestamp       :  { type: Date, default: Date.now }
    , type            :  { type: String, index: true }
    , responseStatus    :  { type: String, index: true } //OK, warning, error
    , responseCode    :  String
    , responseMessage :  String
    , responseTime    :  String
  })
  
  ServiceResponseSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
    
  var Models = [];
  
  mongoose.model('User', UserSchema);
  var User = Models['User'] = mongoose.model('User')
  
  mongoose.model('Server', ServerSchema)
  Models['Server'] = mongoose.model('Server')
  
  mongoose.model('LoginToken', LoginTokenSchema)
  Models['LoginToken'] = mongoose.model('LoginToken')
  
  mongoose.model('ServiceResponse', ServiceResponseSchema)
  Models['ServiceResponse'] = mongoose.model('ServiceResponse')
  
  fn(Models)
}