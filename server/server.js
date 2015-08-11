
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/public'));

var server = require('http').Server(app);
server.listen(app.get('port'));
console.log('Listening on '+app.get('port'));

var moment = require('moment-timezone');
moment.tz.setDefault('America/New_York');
var month = '2015-08-';
var next_time = moment(month+'20 09:00');
var end_time = moment(month+next_time.get('date')+' 19:30');
var cur_uri;
var cur_name;

// db stuff
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var sessions;

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to db");
  sessions = db.collection('sessions');
  // read from db next_time and set end_time

  getCurrent();
  setInterval(getCurrent, 5*60*1000); // roughly, every 5 mins
});



// // Routes
app.get('/insert', function (req, res) {
  if (process.env.SERVER_PASS === req.query.pass) {
    var uri = req.query.uri;
    var name = req.query.name;

    updateTime();
    var s = {
      time: next_time,
      uri: uri,
      name: name
    };

    sessions.insert(s, function(err, result) {
      assert.equal(err, null);
      console.log("inserted");
    });

    res.send('set '+uri+' ('+name+') at '+next_time.format('YYYY-MM-DD hh:mm:ss a'));
  } else {
    res.send('permission denied: thanks for trying');
  }
});

app.get('/get_next_insert', function(req, res) {
  res.json({next: next_time.format(), readable: next_time.format('YYYY-MM-DD hh:mm:ss a')});
});

app.get('/get_current', function(req, res) {
  res.send({uri: cur_uri, name: cur_name, offset: 5}); // pend
});


function getCurrent() {
  
}

function updateTime() {  
  next_time = next_time.add(5, 'm');
  if (!next_time.isBefore(end_time)) {
    updateNext();
  }
  next_time = moment(month+(next_time.get('date')+1)+' 09:00');
  end_time = moment(month+next_time.get('date')+' 19:30');
  // update db
}

