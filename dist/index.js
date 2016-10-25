var cool = require('cool-ascii-faces'),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    session = require('express-session'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    express = require('express'),
    app = express(),
    config = require('../config'),
    path = require('path');

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (obj, done) {
  done(null, obj);
});

var clientID = config.prod ? config.prodFacebook_api_key : config.facebook_api_key,
    clientSecret = config.prod ? config.prodFacebook_api_secret : config.facebook_api_secret;

// Use the FacebookStrategy within Passport.
passport.use(new FacebookStrategy({
  clientID: clientID,
  clientSecret: clientSecret,
  callbackURL: config.callback_url,
  profileFields: ['id', 'emails', 'name', 'gender', 'profileUrl', 'photos']
}, function (accessToken, refreshToken, profile, done) {
  process.nextTick(function () {
    //Check whether the User exists or not using profile.id
    if (config.use_database === 'true') {
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

app.use(express.static(path.join(__dirname, '../public')));

// views is directory for all template files
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', key: 'sid' }));
app.use(passport.initialize());
app.use(passport.session());

app.get('/', function (request, response) {
  response.render('pages/index');
});

app.get('/app', function (req, res) {
  console.log('Yup, you are doing things right', req.body.firstName);
  res.render('pages/app-form');
});

app.post('/app-form-submit', function (req, res) {
  res.render('pages/app-form');
});

/*
* Facebook Login.
* It only works locally
*/
app.get('/auth/facebook', passport.authenticate('facebook', { scope: 'email' }));

app.get('/auth/facebook/callback', passport.authenticate('facebook', { successRedirect: '/datosFacebook', failureRedirect: '/login' }), function (req, res) {
  res.redirect('/');
});

app.get('/datosFacebook', function (req, res) {

  console.log(`
    id: ${ req.user.id }
    name: ${ req.user.name.givenName }
    middle name: ${ req.user.name.middleName }
    family name: ${ req.user.name.familyName }
    emails: ${ req.user.emails[0].value }
    provider: ${ req.user.provider }
  `);
  res.redirect('/');
});
// <--- Facebook Login Ends --->


app.listen(app.get('port'), function () {
  console.log('Node app is running on port', app.get('port'));
});