module.exports = function(app, sq) {  
  var Schema = sq.lib.mongoose.Schema
    , ObjectId = sq.lib.mongoose.SchemaTypes.ObjectId
    , mongoose = sq.lib.mongoose
  //                     Server Services
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  var AnnouncementSchema = new sq.lib.mongoose.Schema({
      message            : String
    , service            : String
    , twitter            : Boolean
  })
  
  AnnouncementSchema.virtual('id')
    .get(function() {
      return this._id.toHexString()
    })
  
  // Let's get initializing!
  sq.lib.mongoose.model( 'Announcement', AnnouncementSchema )
  sq.Announcement = sq.lib.mongoose.model('Announcement')  
}