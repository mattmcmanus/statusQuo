var cluster = require('cluster');

cluster('./app')
  .set('socket path','/tmp')
  .use(cluster.logger('logs'))
  .use(cluster.debug())
  .use(cluster.stats())
  .use(cluster.pidfiles('pids'))
  .use(cluster.cli())
  .use(cluster.repl(8888))
  .use(cluster.reload(['app.js','helpers.js','models.js','routes','node_modules']))
  .listen(8000);