
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

// scheduling
var cron = require('cron');
var cronJob = cron.job("0 */5 * * * *", function(){
  updateCurrent();
}); 

// db stuff
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var sessions;

MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  assert.equal(err, null);
  console.log("Connected correctly to db");
  sessions = db.collection('sessions');

  // init
  sessions.find({meta:true}).toArray(function(err, arr) {
    assert.equal(err, null);
    if (arr.length == 0) {
      resetMeta(start);
    } else {
      next_time = moment(arr[0].next_time);
      start();
    }
  });
});


// // Routes
app.get('/insert', function (req, res) {
  if (process.env.SERVER_PASS === req.query.pass) {
    var uri = req.query.uri;
    var name = req.query.name;
    var time = next_time.format();
    var date = next_time.get('date');
    var hour = next_time.get('hour');

    var s = {date:date, hour:hour, time:time, uri:uri, name:name};
    insertSession(s);
    updateInsertTime();

    s.success = true;
    res.json(s);
  } else {
    res.json({success: false});
  }
});

app.get('/get_old_sessions', function(req, res) {
  if (process.env.SERVER_PASS === req.query.pass) {
    var date = parseInt(req.query.date, 10);
    var hour = parseInt(req.query.hour, 10);
    var s = {date:date, hour:hour};
    if (s.hour === 99) {
      delete(s.hour);
    }
    sessions.find(s).toArray(function(err, arr) {
      var v = [];
      if (!err && arr.length > 0) {
        console.log(arr)
        for (var i=0; i<arr.length; i++) {
          v.push(arr[i].uri);
        }
      } else {
        if (err) console.log(err);
        else if (arr.length === 0) console.log('no videos found for date '+date+' hour '+hour);
      }
      res.json({success:true, vids: v});
    });
  } else {
    res.json({success: false});
  }
});

app.get('/get_next_insert', function(req, res) {
  res.json({next: next_time.format()});
});

app.get('/get_current', function(req, res) {
  if (req.query.restart) {
    if (req.query.restart === 'start') {
      last = moment(month+'20'+start_time_str);
    } else {
      last = moment(req.query.restart);
    }
    last = last.subtract(5, 'minutes'); // sub 5 bc it will get added in updateCurrent
    console.log(last.format());
    preview = true;
    updateCurrent(function() {
      sendCurrent(res);
    });
  } else {
    sendCurrent(res);
  }
});

app.get('/reset_meta', function(req, res) {
  if (process.env.SERVER_PASS === req.query.pass) {
    resetMeta(function(m) {
      res.json(m);
    });
  } else {
    res.json({success:false});
  }
});


function start() {
  updateEndInsertTime();
  updateCurrent();
  cronJob.start();
}

function resetMeta(cb) {
  console.log('reset meta');
  next_time = moment(month+'20'+start_time_str);
  sessions.findAndModify({meta:true},
    ['_id','asc'],
    {$set: {next_time: next_time.format()}},
    {upsert:true},
    function(err, obj) {
      obj.value.next_time = next_time.format();
      if (cb) cb(obj.value);
  });
}

function insertSession(s) {
  sessions.insert(s, function(err, result) {
    assert.equal(err, null);
    console.log("inserted");
  });
}

function updateCurrent(cb) {
  if (preview) { // for testing
    last = last.add(5, 'minutes');
  } else {
    last = moment();
  }
  last.minute(5 * Math.floor( last.get('minute') / 5 ));
  last.second(0);
  last.millisecond(0);

  sessions.find({time: last.format()}).toArray(function(err, arr) {
    assert.equal(err, null);
    if (arr.length > 0) {
      cur_session = arr[0];
    } else {
      console.log('session not found for time '+last.format());
      cur_session = null;
    }
    if (cb) cb();
  });
}

function sendCurrent(res) {
  var offset;
  if (preview) {
    offset = moment().get('minute')%5*60+moment().get('second');
  } else {
    offset = moment().diff(last, 'seconds');
  }
  offset = Math.min(290, offset);
  if (cur_session) {
    res.json({uri: cur_session.uri, name: cur_session.name, offset: offset});
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

function updateEndInsertTime() {
  if (next_time.get('date') === 25) { // last day go as long as needed
    end_time = moment(month+next_time.get('date')+end_time_str).add(5, 'hours');
  } else {
    end_time = moment(month+next_time.get('date')+end_time_str);
  }
  console.log('end time is '+end_time.format());
}

function updateInsertTime() {  
  next_time = next_time.add(5, 'm');
  
  if (next_time.get('hour') === 12 && next_time.get('minute') === 0) {
    next_time.add(15, 'm');
  }
  else if (next_time.get('hour') === 14 && next_time.get('minute') === 0) {
    next_time.add(15, 'm');
  }
  // else if (next_time.get('hour') === 16 && next_time.get('minute') === 0) {
  //   next_time.add(15, 'm');
  // }
  // else if (next_time.get('hour') === 18 && next_time.get('minute') === 0) {
  //   next_time.add(15, 'm');
  // }

  if (!next_time.isBefore(end_time)) {
    next_time = moment(month+(next_time.get('date')+1)+start_time_str);
    updateEndInsertTime();
  }

  sessions.update({meta:true}, {$set: {next_time:next_time.format()}}, function(err, res) {
    if (err) console.log(err);
  });
}

