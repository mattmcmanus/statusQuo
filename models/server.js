module.exports = function(app, sq) {  
  var Schema = sq.lib.mongoose.Schema
    , ObjectId = sq.lib.mongoose.SchemaTypes.ObjectId
    , mongoose = sq.lib.mongoose
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ServiceSchema = new sq.lib.mongoose.Schema({
      name            :  String
    , type            :  { type: String, index: true }
    , url             :  String
    , public          :  { type: Boolean, index: true }
    , lastStatus      :  String
    , lastStatusTime  :  Date
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
      return sq.lib._date(this.lastStatusTime).fromNow()
    })


  //                          Servers
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var ServerSchema = new sq.lib.mongoose.Schema({
      user         :  { type: ObjectId, index: true }
    , created      :  { type: Date, default: Date.now }
    , updated      :  { type: Date, default: Date.now }
    , ip           :  { type: String, index: { unique: true } }
    , name         :  String
    , os           :  String
    , type         :  { type: [String], set: splitTags}
    , services     :  [ServiceSchema]
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
  var ServiceResponseSchema = new sq.lib.mongoose.Schema({
      serverID        :  { type: ObjectId, index: true }
    , serviceID       :  { type: ObjectId, index: true }
    , timestamp       :  { type: Date, default: Date.now }
    , type            :  { type: String, index: true }
    , responseStatus  :  { type: String, index: true } //OK, warning, error
    , responseCode    :  String
    , responseMessage :  String
    , responseTime    :  String
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