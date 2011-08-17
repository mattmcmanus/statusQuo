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
  app.get( '/announcements.:format?',                  index )
  app.get( '/announcements/new',                       sq.isAuth, newForm )
  app.post('/announcements',                           sq.isAuth, create )
  app.get( '/announcements/:announcement.:format?',    sq.isAuth, show )
  app.get( '/announcements/:announcement/edit',        sq.isAuth, edit )
  app.put( '/announcements/:announcement',             sq.isAuth, update )
  
  
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  //                      Route Logic
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  
  //                  Announcment Index
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function index(req, res){
    sq.Announcement.find({}).sort('updatedAt', -1 ).limit(10).run(function (err, a) {
      if (req.params.format === 'json')
        res.send(a)
      else if (req.xhr)
        res.partial('announcement/index', {announcements: a})
      else
        res.render('announcement/index', {announcements: a})
    })
  }
  
  
  //                  Create Announcement Form
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function newForm(req, res){
    // Setup the new server
    var a = new sq.Announcement()
    
    if (req.xhr)
      res.partial('announcement/new', { announcement: a })
    else
      res.render('announcement/new', { announcement: a })
  }
  
  //                  POST new Announcement
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function create(req, res){
    console.log(req.body.announcement)
    var a = new sq.Announcement(req.body.announcement)
    
    a.save(function(err){
      if (err) {
        req.flash('error', 'Err, Something broke when we tried to save your server. Sorry!')
        console.log("Mongoose ERROR:" + err)
        
      }
      if (req.xhr)
        res.send(a)
      else
        res.redirect('/')
    });
  }
  
  //                  Show Announcement
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function show(req, res){
    if (req.params.format === 'json')
      res.send(req.a.toObject())
    else if (req.xhr)
      res.partial('announcement/show', {announcement: req.a})
    else
      res.render('announcement/show', {announcement: req.a})
  }
  
  //                  Edit Announcement
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function edit(req, res){}
  
    //                  Update Announcement
  // - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  function update(req, res){}
}