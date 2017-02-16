'use strict';

var _passport = require('passport');

var _passport2 = _interopRequireDefault(_passport);

var _expressSession = require('express-session');

var _expressSession2 = _interopRequireDefault(_expressSession);

var _cookieParser = require('cookie-parser');

var _cookieParser2 = _interopRequireDefault(_cookieParser);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _config = require('../config');

var _config2 = _interopRequireDefault(_config);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var FacebookStrategy = require('passport-facebook').Strategy;
var app = (0, _express2.default)();

_passport2.default.serializeUser(function (user, done) {
  done(null, user);
});

_passport2.default.deserializeUser(function (obj, done) {
  done(null, obj);
});

var clientID = _config2.default.prod ? _config2.default.prodFacebook_api_key : _config2.default.facebook_api_key,
    clientSecret = _config2.default.prod ? _config2.default.prodFacebook_api_secret : _config2.default.facebook_api_secret;

// Use the FacebookStrategy within Passport.
_passport2.default.use(new FacebookStrategy({
  clientID: clientID,
  clientSecret: clientSecret,
  callbackURL: _config2.default.callback_url,
  profileFields: ['id', 'emails', 'name', 'gender', 'profileUrl', 'photos']
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    //Check whether the User exists or not using profile.id
    if (_config2.default.use_database === 'true') {
      connection.query("SELECT * from user_info where user_id=" + profile.id, function (err, rows, fields) {
        if (err) throw err;
        if (rows.length === 0) {
          console.log("There is no such user, adding now");
          connection.query("INSERT into user_info(user_id,user_name) VALUES('" + profile.id + "','" + profile.username + "')");
        } else {
          console.log("User already exists in database");
        }
      });
    }
    return done(null, profile);
  });
}));

app.set('port', process.env.PORT || 5000);

app.use(_express2.default.static(_path2.default.join(__dirname, '../public')));

// view engine setup
// views is directory for all template files
app.set('views', _path2.default.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.set('config', _config2.default);

// Middleware
app.use((0, _cookieParser2.default)());
app.use(_bodyParser2.default.urlencoded({ extended: false }));
app.use((0, _expressSession2.default)({ secret: 'keyboard cat', key: 'sid' }));
app.use(_passport2.default.initialize());
app.use(_passport2.default.session());
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

// Routes
require('./routes/routes')(app, _express2.default);

app.get('/', function (request, response) {
  response.render('pages/index');
});

app.get('/app', function (req, res) {
  res.render('pages/app-form');
});

app.get('/user', function (req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify({
    user: 'Mauricio'
  }));
});

app.post('/app-form-submit', function (req, res) {
  res.locals.firstName = req.body.firstName;
  res.locals.email = req.body.email;
  res.render('pages/app-form-submit');
});

/*
* Facebook Login.
* It only works locally
*/
app.get('/auth/facebook', _passport2.default.authenticate('facebook', { scope: 'email' }));

app.get('/auth/facebook/callback', _passport2.default.authenticate('facebook', { successRedirect: '/datosFacebook', failureRedirect: '/login' }), function (req, res) {
  res.redirect('/');
});

app.get('/datosFacebook', function (req, res) {

  console.log('\n    id: ' + req.user.id + '\n    name: ' + req.user.name.givenName + '\n    middle name: ' + req.user.name.middleName + '\n    family name: ' + req.user.name.familyName + '\n    emails: ' + req.user.emails[0].value + '\n    provider: ' + req.user.provider + '\n  ');
  res.redirect('/');
});
// <--- Facebook Login Ends --->

app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});

module.exports = app;