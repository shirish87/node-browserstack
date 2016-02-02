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
  this.timeout(10000);

  var client;
  var workers = [];

  beforeEach(function() {
    client = BrowserStack.createScreenshotClient({
      username: username,
      password: password
    });
  });

  afterEach(function(done) {
    util.terminateWorkers(client, workers, function() {
      workers = [];
      done();
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

});
