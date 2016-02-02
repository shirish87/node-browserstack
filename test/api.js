'use strict';

var should = require('should');
var BrowserStack = require('../lib/browserstack');

var username = process.env.BROWSERSTACK_USERNAME;
var password = process.env.BROWSERSTACK_KEY;

if (!username || !password) {
  throw new Error('Please set BROWSERSTACK_USERNAME and BROWSERSTACK_KEY environment variables.');
}

describe('BrowserStack API', function() {
  this.timeout(10000);

  var client;

  before(function() {
    client = BrowserStack.createClient({
      username: username,
      password: password
    });
  });

  describe('API Status', function() {
    it('should get API status', function(done) {
      client.getApiStatus(function(err, status) {
        should.ifError(err);

        status.should.be.an.Object().and.have.keys([
          'running_sessions',
          'sessions_limit',
          'used_time',
          'total_available_time'
        ]);

        done(err);
      });
    });
  });

  describe('Browser Listing', function() {
    it('should list browsers', function(done) {
      client.getBrowsers(function(err, browsers) {
        should.ifError(err);

        browsers.should.be.an.Array().and.not.be.empty();
        browsers.map(validateBrowserObject);

        done(err);
      });
    });

    it('should get latest browser versions', function(done) {
      client.getLatest(function(err, versions) {
        should.ifError(err);

        versions.should.be.an.Object().and.not.be.empty();
        done(err);
      });
    });

    it('should get the latest version for specified browser', function(done) {
      client.getBrowsers(function(err, browsers) {
        should.ifError(err);

        browsers = browsers.filter(function(b) {
          return !b.device;
        });

        var requests = browsers.length;

        browsers.forEach(function(browser) {
          client.getLatest(browser, function(err, version) {
            should.ifError(err);
            version.should.match(/\d+(\.)*\d*/);

            if (err || --requests < 1) {
              done && done(err);
              done = null;
            }
          });
        });
      });
    });

    it('should fail to get the latest version for invalid browser', function(done) {
      client.getLatest({
        os: 'Windows',
        os_version: '10',
        browser: 'mosaic'
      }, function(err, version) {
        should.ifError(err);
        should.equal(undefined, version);

        done(err);
      });
    });
  });

  describe('Worker API', function() {
    var sampleDesktopBrowser = {
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: '47.0',
      timeout: 20
    };

    var sampleDeviceBrowser = {
      device: 'Google Nexus 6',
      os: 'android',
      os_version: '5.0',
      browser: 'Android Browser',
      timeout: 20
    };

    it('should create worker', function(done) {
      client.createWorker(merge(sampleDesktopBrowser, {
        url: 'http://www.example.com'
      }), function(err, worker) {
        should.ifError(err);

        validateWorker(worker);
        done(err);
      });
    });

    it('should fail to create worker for invalid browser', function(done) {
      client.createWorker(merge(sampleDesktopBrowser, {
        url: 'http://www.example.com',
        browser: 'mosaic'
      }), function(err, worker) {
        err.should.be.an.Error();
        err.message.should.match(/validation failed/i);

        should.not.exist(worker);
        done();
      });
    });

    it('should create a worker with details', function(done) {
      client.createWorker(merge(sampleDesktopBrowser, {
        url: 'http://www.example.com',
        name: 'worker-1',
        build: 'build-1',
        project: 'project-1'
      }), function(err, worker) {
        should.ifError(err);

        validateWorker(worker);
        done(err);
      });
    });

    it('should create a worker for a device browser', function(done) {
      client.createWorker(merge(sampleDeviceBrowser, {
        url: 'http://www.example.com'
      }), function(err, worker) {
        should.ifError(err);

        validateWorker(worker);
        done(err);
      });
    });

    it('should fail to create worker for invalid device', function(done) {
      client.createWorker(merge(sampleDeviceBrowser, {
        url: 'http://www.example.com',
        device: 'Nexus 5S'
      }), function(err, worker) {

        err.should.be.an.Error();
        err.message.should.match(/validation failed/i);

        should.not.exist(worker);
        done();
      });
    });

    it('should get created worker by id', function(done) {
      client.createWorker(merge(sampleDeviceBrowser, {
        url: 'http://www.example.com'
      }), function(err, worker) {
        should.ifError(err);

        validateWorker(worker);

        client.getWorker(worker.id, function(err, worker2) {
          should.ifError(err);

          validateWorker(worker2);
          should.equal(worker.id, worker2.id, 'Worker id mismatch');
          done(err);
        });
      });
    });

    it('should fetch list of workers', function(done) {
      client.getWorkers(function(err, workers) {
        should.ifError(err);

        workers.should.be.an.Array().and.not.be.empty();
        workers.forEach(function(w) {
          w.id.should.match(/\d+/);
        });

        done();
      });
    });

    it('should terminate a worker by id', function(done) {
      client.createWorker(merge(sampleDeviceBrowser, {
        url: 'http://www.example.com'
      }), function(err, worker) {
        should.ifError(err);

        validateWorker(worker);

        client.terminateWorker(worker.id, function(err, data) {
          should.ifError(err);

          data.should.be.an.Object();
          data.time.should.match(/\d+/);

          done(err);
        });
      });
    });
  });

  describe('Worker Session APIs', function() {
    this.timeout(100000);

    var sampleDesktopBrowser = {
      os: 'Windows',
      os_version: '10',
      browser: 'chrome',
      browser_version: '47.0',
      timeout: 120
    };

    it('should change worker url', function(done) {
      client.createWorker(merge(sampleDesktopBrowser, {
        url: 'http://www.example.com'
      }), function(err, worker) {
        should.ifError(err);

        validateWorker(worker);

        pollWorker(client, worker, function(err, isRunning) {
          if (isRunning) {
            return client.changeUrl(worker.id, {
              url: 'http://www.example.net',
              timeout: 20
            }, function(err, data) {
              should.ifError(err);

              data.should.be.an.Object();
              data.message.should.match(/browser updated with new url/i);

              done(err);
            });
          }

          should.ifError(err);
          return done(err || new Error('worker remained in queue until timeout'));
        });

      });
    });

    it('should take screenshot of worker session', function(done) {
      client.createWorker(merge(sampleDesktopBrowser, {
        url: 'http://www.example.com'
      }), function(err, worker) {
        should.ifError(err);
        validateWorker(worker);

        pollWorker(client, worker, function(err, isRunning) {
          if (isRunning) {

            // wait for page load
            return setTimeout(function() {
              client.takeScreenshot(worker.id, function(err, data) {
                should.ifError(err);

                data.should.be.an.Object();
                data.url.should.match(/^http(s)?:\/\/.*\.png$/i);

                done(err);
              });
            }, 5000);
          }

          should.ifError(err);
          return done(err || new Error('worker remained in queue until timeout'));
        });

      });
    });

  });
});

function pollWorker(client, worker, callback) {
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
}

function validateBrowserObject(b) {
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
}

function validateWorker(w) {
  w.should.be.an.Object();
  w.id.should.match(/\d+/);
}

function copyObject(o, dest) {
  return Object.keys(o).reduce(function(prev, k) {
    prev[k] = o[k];
    return prev;
  }, dest || {});
}

function merge(o, a) {
  return copyObject(a, copyObject(o));
}
