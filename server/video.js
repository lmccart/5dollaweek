var request = require('request');
var python = require('python-shell');
var fs = require('fs');

var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);

var server = require('http').Server(app);
server.listen(app.get('port'));
console.log('Listening on '+app.get('port'));

var all;
var ind = 114;

// db stuff
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var sessions;

var files = fs.readdirSync('/Users/lmccart/Documents/eo/recordings2/compressed/');

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  assert.equal(err, null);
  console.log("Connected correctly to db");
  sessions = db.collection('sessions');

  // init
  sessions.find().toArray(function(err, arr) {
    assert.equal(err, null);
    
    all = arr;
    checkVid();
  });
});

function checkVid() {
  var vid = all[ind].uri.replace('/videos/', '');
  request.get('http://vimeo.com/'+vid, {timeout: 30000, json:false}, function (error, result) {
    var info = ind+' '+all[ind].name+' '+all[ind].uri+' '+all[ind].time;
    if (result.statusCode === 200) {
      console.log('OK '+info);
      ind++;
      checkVid();
    } else if (result.statusCode === 404) {
      console.log('NOT FOUND '+info);
      // upload and update entry
      upload(all[ind].name)
    } else {
      console.log('UNKNOWN '+info)
    }

  });
}

function upload(n) {
  var f = findFilename(n);
  if (f) {
    console.log('found video '+f+', beginning upload');
    var options = {
      scriptPath: '/Users/lmccart/Documents/eo/',
      args: ['-f', '/Users/lmccart/Documents/eo/recordings2/compressed/'+f, '-n', n]
    };

    python.run('upload.py', options, function (err, results) {
      assert.equal(err, null);
      // results is an array consisting of messages collected during execution
      console.log('results: %j', results);
      ind++;
      checkVid();
    });
  } else {
    console.log('error: no video for '+n);
  }
}

function findFilename(n) {
  var filtered = files.filter(function(it) {
      return (it.indexOf(n) !== -1);
    }
  );
  if (filtered.length > 0) {
    return filtered[0];
  } else {
    return null;
  }
}

