'use strict';

var assert = require('assert');
var BrowserStack = require('../lib/browserstack');

var apiLatestVersion = 4;

var username = process.env.BROWSERSTACK_USERNAME;
var password = process.env.BROWSERSTACK_KEY;

if (!username || !password) {
  throw new Error('Please set BROWSERSTACK_USERNAME and BROWSERSTACK_KEY environment variables.');
}

describe('Public API', function() {
  it('exposes API and Screenshots clients', function() {
    [
      'createClient',
      'createScreenshotClient'
    ].forEach(function(fn) {
      assert.equal('function', typeof BrowserStack[fn]);
    });
  });

  describe('new ApiClient', function() {
    var className = 'ApiClient';

    it('should return an API client', function() {
      var client = BrowserStack.createClient({
        username: username,
        password: password
      });

      assert.equal(className, client.constructor.name, 'instance of ' + className);
    });

    it('should return an API client of a particular version', function() {
      for (var v = 1; v <= apiLatestVersion; v++) {
        var client = BrowserStack.createClient({
          username: username,
          password: password,
          version: v
        });

        assert.equal(className, client.constructor.name, 'instance of ApiClient');
        assert.equal(v, client.version, 'ApiClient version mismatch');
      }
    });

    it('should throw an error for invalid ApiClient version', function() {
      try {
        BrowserStack.createClient({
          username: username,
          password: password,
          version: -1
        });
      } catch (e) {
        assert.ok(e.toString().match(/invalid version/i));
      }
    });

    it('should contain public methods', function() {
      var client = BrowserStack.createClient({
        username: username,
        password: password
      });

      [
        'getApiStatus',
        'getBrowsers',
        'getBrowserId',
        'getLatest',
        'getWorkers',
        'getWorker',
        'createWorker',
        'terminateWorker',
        'takeScreenshot'
      ].forEach(function(fn) {
        assert.equal('function', typeof client[fn]);
      });
    });
  });

  describe('new ScreenshotClient', function() {
    var className = 'ScreenshotClient';

    it('should return a screenshot client', function() {
      var client = BrowserStack.createScreenshotClient({
        username: username,
        password: password
      });

      assert.equal(className, client.constructor.name, 'instance of ' + className);
    });

    it('should contain public methods', function() {
      var client = BrowserStack.createScreenshotClient({
        username: username,
        password: password
      });

      [
        'getBrowsers',
        'generateScreenshots',
        'getJob'
      ].forEach(function(fn) {
        assert.equal('function', typeof client[fn]);
      });
    });

  });
});
