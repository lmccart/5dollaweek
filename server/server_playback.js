
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);
app.use(express.static(__dirname + '/viewer'));

var server = require('http').Server(app);
server.listen(app.get('port'));
console.log('Listening on '+app.get('port'));

var moment = require('moment-timezone');
moment.tz.setDefault('America/New_York');
var month = '2015-08-';
var start_time_str = ' 10:00';
var end_time_str = ' 20:00';
var next_time;
var end_time;
var cur_session;
var last;
var preview = false;


// db stuff
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var sessions;

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  assert.equal(err, null);
  console.log("Connected correctly to db");
  sessions = db.collection('sessions');
});

app.get('/get_current', function(req, res) {
  var time;
  if (req.query.restart === 'start') { // beginning
    time = moment(month+'20'+start_time_str);
  } else { // specfic time
    time = moment(req.query.restart);
  }
  console.log(time.format());
  getCurrent(res, time);
});

function getCurrent(res, time) {
  last = time;
  last.minute(5 * Math.floor( time.get('minute') / 5 ));
  last.second(0);
  last.millisecond(0);

  var session, offset;

  sessions.find({time: last.format()}).toArray(function(err, arr) {
    assert.equal(err, null);
    if (arr.length > 0) {
      session = arr[0];
      offset = Math.min(290, time.diff(last, 'seconds'));
    } else {
      console.log('session not found for time '+time.format());
    }
    sendCurrent(res, session, offset);
  });
}

function sendCurrent(res, session, offset) {
  if (session) {
    res.json({uri: session.uri, name: session.name, offset: offset});
  } else {

    var explain;
    var d = moment().get('date');
    var h = moment().get('hour');


    var viewit = 'You can view it live 8/20-25 from 10am-8pm EST.';

    if (d < 20) {
      explain = 'The performance has not yet begun.<br>'+viewit;
    } else if (d >= 25 && h >= 16) {
      explain = 'The performance has ended.';
    } else {
      if (h < 10) {
        explain = 'The performance has not yet begun today.<br>'+viewit;
      } else if (h > 19) {
        explain = 'The performance has ended for today.<br>'+viewit;
      } else if (h == 12) {
        explain = 'Performance will resume after a break from 12-12:15pm.';
      } else if (h == 14) {
        explain = 'Performance will resume after a break from 2-2:15pm.';
      } 
      // else if (h == 16) {
      //   explain = 'Performance will resume after a break from 4-4:15pm.';
      // } else if (h == 18) {
      //   explain = 'Performance will resume after a break from 6-6:15pm.';
      // }
      console.log(h)
    }
    res.json({cur_session: false, explain: explain});
  }
}
