'use strict';

var extend = require('../lib/extend');

module.exports.terminateWorkers = function terminateWorkers(client, workers, callback) {
  if (!workers.length) {
    return callback(null);
  }

  if (workers[0].id) {
    workers = workers.map(function(w) {
      return w.id;
    });
  }

  client.terminateWorker(workers.shift(), function() {
    if (!workers.length) {
      return callback(null);
    }

    terminateWorkers(client, workers, callback);
  });
};

module.exports.pollWorker = function pollWorker(client, worker, callback) {
  var maxRetries = 10;
  var retryInterval = 2000;
  var timer;

  var pollWorkerState = function(id, callback) {
    maxRetries--;

    if (--maxRetries < 1) {
      clearTimeout(timer);
      return callback(null, false);
    }

    client.getWorker(id, function(err, worker) {
      if (err || !worker.id) {
        clearTimeout(timer);
        return callback(null, false);
      }

      if (worker.status && worker.status === 'running') {
        return callback(null, true);
      }

      setTimeout(function() {
        pollWorkerState(id, callback);
      }, retryInterval);
    });
  };

  pollWorkerState(worker.id, callback);
};

module.exports.validateBrowserObject = function validateBrowserObject(b) {
  [
    'os',
    'os_version',
    'browser',
    b.device ? 'device' : 'browser_version'
  ].forEach(function(attr) {
    if (attr.match(/version/)) {
      b[attr].should.be.a.String().and.match(/\S+/);
    } else {
      b[attr].should.be.a.String().and.match(/^[a-zA-Z]+/);
    }
  });
};

module.exports.validateWorker = function validateWorker(w) {
  w.should.be.an.Object();
  w.id.should.match(/\d+/);
};

module.exports.merge = function merge(o, a) {
  return extend(extend({}, o), a);
};
