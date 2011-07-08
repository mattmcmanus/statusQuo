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
      .set('socket path', path)
    .in('development')
      .use(cluster.logger(path + '/logs', 'debug'))
      .use(cluster.debug())
      .use(cluster.pidfiles(path + '/pids'))
      .use(cluster.stats({ connections: true, lightRequests: true }))
      .use(cluster.repl(8888))
      .use(cluster.cli())
      .use(cluster.reload(['app.js','helpers.js','models','lib','node_modules']))
    .in('test')
      .use(cluster.logger(path + '/logs', 'warning'))
      .use(cluster.pidfiles(path + '/pids'))
      .use(cluster.stats({ connections: true, lightRequests: true }))
    .in('production')
      .use(cluster.logger(path + '/logs'))
      .use(cluster.pidfiles(path + '/pids'))
      .use(cluster.stats({ connections: true, lightRequests: true }))
    .in('all')
      .set('workers','4')
      .listen(port);

    console.log('======================================================================')
    console.log('   StatusQuo Server ('+app.set('environment')+') started on port '+port+'     ')
    console.log('======================================================================')

});
