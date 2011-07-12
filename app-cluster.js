var cluster = require('cluster')
  , port = 8000
  , path = __dirname
  , app;

require('./app').boot(function(app) {

  /**
   * TODO: Check to ensure that the logs and pids folders exist before launching
   */

  cluster(app)
      .set('working directory', path)
      .set('socket path', path+'/tmp')
      .use(cluster.pidfiles(path+'/pids'))
      .use(cluster.stats({ connections: true, lightRequests: true }))
    .in('development')
      .use(cluster.logger(path+'/logs', 'debug'))
      .use(cluster.debug())
      .use(cluster.repl(8888))
      .use(cluster.cli())
      .use(cluster.reload(['app-cluster.js','app.js','helpers.js','models','lib','node_modules']))
    .in('test')
      .use(cluster.logger(path+'/logs', 'warning'))
    .in('production')
      .use(cluster.logger(path+'/logs', 'error'))
    .in('all')
      .set('workers','2')
      .listen(port);

    console.log('\x1b[36m======================================================================')
    console.log('\x1b[0m   StatusQuo Server ('+app.set('environment')+') started on port '+port+'     ')
    console.log('\x1b[36m======================================================================')

});
