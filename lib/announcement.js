module.exports = function(app, sq){
  var _ = require('underscore')
  
  //                      PARAMETERS
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  app.param('announcement', function(req, res, next, id){
    sq.Announcement.findById(id, function(err, a) {
      if (err) return next(err)
      if (!a) return next(new Error('failed to find server'))
      req.a = a
      next()
    })
  })
  
  //                      Routes
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  app.get( '/announcement/new',                       sq.isAuth, createAnnouncementForm )
  app.post('/announcement/new',                       sq.isAuth, createAnnouncement )
  app.get( '/server/:announcement.:format?',          sq.isAuth, showAnnouncementByID )
  
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //                      Route Logic
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  
  //                  Create Announcement Form
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function createAnnouncementForm(req, res){
    // Setup the new server
    var a = new sq.Announcement()
    
    if (req.xhr)
      res.partial('server/new', { announcement: a })
    else
      res.render('server/new', { announcement: a })
  }
  
  //                  POST new Announcement
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function createAnnouncement(req, res){
    var a = new sq.Announcement(req.body.announcement)
    
    a.save(function(err){
      if (err) {
        req.flash('error', 'Err, Something broke when we tried to save your server. Sorry!')
        console.log("Mongoose ERROR:" + err)
        res.redirect('/')
      }
    });
  }
  
  //                  Show Announcement
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function showAnnouncementByID(req, res){
    if (req.params.format === 'json')
      res.send(req.a.toObject())
    else if (req.xhr)
      res.partial('announcement/show', {announcement: req.a})
    else
      res.render('announcement/show', {announcement: req.a})
  }
}