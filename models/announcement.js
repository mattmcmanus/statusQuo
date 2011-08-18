var _ = require('underscore')
  , _date = require('underscore.date')

module.exports = function(app, sq) {  
  var Schema = sq.lib.mongoose.Schema
    , ObjectId = sq.lib.mongoose.SchemaTypes.ObjectId
    , mongoose = sq.lib.mongoose
    , mongooseTypes = require("mongoose-types")
    , useTimestamps = mongooseTypes.useTimestamps;
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var AnnouncementSchema = new sq.lib.mongoose.Schema({
      message            : String
    , service            : {
        id               : ObjectId
      , name             : String
      }
    , twitter            : Boolean
  })
  
  AnnouncementSchema.plugin(useTimestamps)
  
  AnnouncementSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })

  // Let's get initializing!
  sq.lib.mongoose.model( 'Announcement', AnnouncementSchema )
  sq.Announcement = sq.lib.mongoose.model('Announcement')  
}