
var express = require('express');
var app = express();
app.set('port', process.env.PORT || 3000);
app.set('view engine', 'jade');
var bodyParser = require('body-parser');
var moment = require('moment-timezone');

var server = require('http').Server(app);
server.listen(app.get('port'));
console.log('Listening on '+app.get('port'));

// push notif stuff
var apn = require('apn');
var options = { };
var apnConnection = new apn.Connection(options);

// forms
var forms = require('forms');
var fields = forms.fields;
var validators = forms.validators;
var widgets = forms.widgets;

// db stuff
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var users_db;

// Use connect method to connect to the Server
MongoClient.connect(process.env.MONGOLAB_URI, function(err, db) {
  assert.equal(null, err);
  console.log("Connected correctly to db");
  users_db = db.collection('users');
});


var lat = 40.730, lng = -73.994;
var last_update = '';
var following = false; // whether server is trying to follow
var broadcasting = false; // whether app is broadcasting

// Add headers
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');
  res.setHeader('Access-Control-Allow-Credentials', true);
  next();
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname + '/public'));

// Routes
app.get('/', function (req, res) {
  res.render('index', { title: 'Hey', message: 'Hello there!'});
});

app.get('/get-followed', function (req, res) {
  res.render('get-followed', {form: get_followed_form.toHTML()});
});

app.get('/become-follower', function (req, res) {
  res.render('become-follower', {form: become_follower_form.toHTML()});
});

app.get('/follow', function (req, res) {
  res.render('follow', { key: process.env.GMAPS_KEY, lat: lat, lng: lng, updated: last_update});
});

app.get('/faq', function (req, res) {
  res.render('faq', {});
});


// FORM STUFF
var get_followed_form = forms.create({
  username: fields.string({ required: true }),
  password: fields.password({ required: validators.required('You definitely want a password') }),
  confirm:  fields.password({
    required: validators.required('don\'t you know your own password?'),
    validators: [validators.matchField('password')]
  }),
  email: fields.email()
});

var become_follower_form = forms.create({
  username: fields.string({ required: true }),
  password: fields.password({ required: validators.required('You definitely want a password') }),
  confirm:  fields.password({
    required: validators.required('don\'t you know your own password?'),
    validators: [validators.matchField('password')]
  }),
  email: fields.email()
});

app.post('/get_followed', function (req, res) {
  get_followed_form.handle(req, {
    success: function (form) {
      console.log(form.data);
      res.send('thanks');
    },
    error: function (form) {
      res.render('get-followed', {form: form.toHTML()});
    },
    empty: function (form) {
      res.render('get-followed', {form: get_followed_form.toHTML()});
    }
  });
});


app.post('/become_follower', function (req, res) {
  become_follower_form.handle(req, {
    success: function (form) {
      console.log(form.data);
      res.send('thanks');
    },
    error: function (form) {
      res.render('become_follower', {form: form.toHTML()});
    },
    empty: function (form) {
      res.render('become_follower', {form: become_follower_form.toHTML()});
    }
  });
});


app.get('/get_loc', function (req, res) {
  res.json({lat: lat, lng: lng, updated: last_update, broadcasting: broadcasting});
});


app.get('/set_status', function (req, res) {
  following = parseInt(req.query.following, 10) == true;
  res.json({following: following});
});

app.post('/update_status', function (req, res) {
  console.log(req.body.bc);
  lat = parseFloat(req.body.lat);
  lng = parseFloat(req.body.lng);
  broadcasting = parseInt(req.body.bc, 10) == true;
  last_update = moment().tz("America/New_York").format('MM-DD HH:mm');
  console.log(req.body);
  res.json({following: following});
});


//   // if (process.env.SERVER_PASS === req.query.pass) {
//   //   var new_hr = parseInt(req.query.hr, 10);

//   //   if (new_hr !== 0) {
//   //     hr = new_hr;
//   //     var r = { hr: hr, timestamp: new Date().getTime() };

//   //     stored_hr.insert(r, function(err, result) {
//   //       assert.equal(err, null);
//   //       console.log("inserted");
//   //     });
//   //   }

//   //   res.send('thanks');
//   // } else {
//   //   res.send('permission denied: thanks for trying');
//   // }
//   res.send('thanks');
// });


function bootstrapField(name, object) {
  if (!Array.isArray(object.widget.classes)) { object.widget.classes = []; }
  if (object.widget.classes.indexOf('form-control') === -1) {
    object.widget.classes.push('form-control');
  }

  var label = object.labelHTML(name);
  var error = object.error ? '<div class="alert alert-error help-block">' + object.error + '</div>' : '';

  var validationclass = object.value && !object.error ? 'has-success' : '';
  validationclass = object.error ? 'has-error' : validationclass;

  var widget = object.widget.toHTML(name, object);
  return '<div class="form-group ' + validationclass + '">' + label + widget + error + '</div>';
}

