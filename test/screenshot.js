'use strict';

var should = require('should');
var BrowserStack = require('../lib/browserstack');
var util = require('./util');

var username = process.env.BROWSERSTACK_USERNAME;
var password = process.env.BROWSERSTACK_KEY;

if (!username || !password) {
  throw new Error('Please set BROWSERSTACK_USERNAME and BROWSERSTACK_KEY environment variables.');
}

describe('Screenshot API', function() {
  this.timeout(300000); // 300s

  var client;

  beforeEach(function() {
    client = BrowserStack.createScreenshotClient({
      username: username,
      password: password
    });
  });

  it('should list browsers', function(done) {
    client.getBrowsers(function(err, browsers) {
      should.ifError(err);

      browsers.should.be.an.Array().and.not.be.empty();
      browsers.map(util.validateBrowserObject);

      done(err);
    });
  });

  it('should generate screenshots for multiple browsers', function(done) {
    var options = {
      url: 'http://www.example.com',
      browsers: ['40.0', '41.0', '42.0'].map(function(v) {
        return {
          os: 'Windows',
          os_version: '7',
          browser: 'chrome',
          browser_version: v
        };
      })
    };

    client.generateScreenshots(options, function(err, job) {
      should.ifError(err);

      job.should.be.an.Object().and.not.be.empty();
      job.job_id.should.match(/[a-zA-Z0-9]+/);

      [
        'quality',
        'win_res',
        'wait_time'
      ].forEach(function(k) {
        job.should.have.property(k);
      });

      job.screenshots
        .map(util.validateBrowserObject)
        .forEach(function(b) {
          b.id.should.match(/[a-zA-Z0-9]+/);
          ['pending', 'queue', 'running'].should.containEql(b.state);
        });

      util.pollScreenshotWorker(client, job, function(err, isRunning) {
        if (!err && !isRunning) {

          // this is highly dependent on demand and queue time at BrowserStack;
          // little point in stalling the test run waiting for this job to complete

          // print warning in console for user to decide
          console.warn('\t[WARN] worker %s did not enter running state within timeout', job.job_id);
        }

        done(err);
      });
    });
  });

});
