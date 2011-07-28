var _ = require('underscore')
  , _date = require('underscore.date')
  
module.exports = function(app, sq) {  
  var Schema = sq.lib.mongoose.Schema
    , ObjectId = sq.lib.mongoose.SchemaTypes.ObjectId
    , mongoose = sq.lib.mongoose
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ServiceSchema = new sq.lib.mongoose.Schema({
      name            : String
    , type            : { type: String, index: true, default: 'http' }
    , url             : String
    , public          : { type: Boolean, index: true }
    , delta           : Number
    , enabled         : { type: Boolean, default: true }
    , lastStatus      : String
    , lastStatusTime  : Date
  })

  ServiceSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  ServiceSchema.virtual('hostname')
    .get(function() {
      return require('url').parse(this.url).hostname
    })
  ServiceSchema.virtual('lastStatusTimeRelative')
    .get(function() {
      var time = _date(this.lastStatusTime).fromNow()
      return time
    })

  //                          Servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function splitTags(tags) {
    if (tags.length === 1) {
      tags = tags[0].split(',')
      _.each(tags, function(tag, key){
        if (tag == ' ') tags.splice(key,1)
        else {
          tags[key] = tag.toLowerCase().replace(/^\s+|\s+$/g,"")
        }
      })
    } 
    
    return tags
  }
  
  var ServerSchema = new sq.lib.mongoose.Schema({
      user         :  { type: ObjectId, index: true }
    , created      :  { type: Date, default: Date.now }
    , updated      :  { type: Date, default: Date.now }
    , ip           :  { type: String, index: { unique: true } }
    , name         :  String
    , os           :  String
    , type         :  { type: [String], set: splitTags }
    , services     :  [ServiceSchema]
  })

  ServerSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  ServerSchema.virtual('typeList')
    .get(function(){
      return this.type.join(', ')
    })
  ServerSchema.virtual('typeListPretty')
    .get(function(){
      var context = this.type
      _.each(context, function(type, key){ context[key] = '<span class="type '+type+'">'+type+'</span>' })
      return context.join('')
    })

  //                     Status Log
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ServiceResponseSchema = new sq.lib.mongoose.Schema({
      serverID        :  { type: ObjectId, index: true }
    , serviceID       :  { type: ObjectId, index: true }
    , timestamp       :  { type: Date, default: Date.now }
    , type            :  { type: String, index: true }
    , responseStatus  :  { type: String, index: true } //OK, warning, error
    , responseCode    :  Number
    , responseMessage :  String
    , responseTime    :  String
    , pingPacketLoss  :  Number
    , pingTimeMin     :  Number
    , pingTimeMax     :  Number
    , pingTimeAvg     :  Number
  })

  ServiceResponseSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  
  // Let's get initializing!
  sq.lib.mongoose.model( 'Server', ServerSchema )
  sq.lib.mongoose.model( 'Service', ServiceSchema )
  sq.Server = sq.lib.mongoose.model('Server')
  
  sq.lib.mongoose.model( 'ServiceResponse', ServiceResponseSchema )
  sq.ServiceReponse = sq.lib.mongoose.model('ServiceResponse')
}