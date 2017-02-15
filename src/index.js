var passport = require('passport'),
  FacebookStrategy = require('passport-facebook').Strategy,
  session = require('express-session'),
  cookieParser = require('cookie-parser'),
  bodyParser = require('body-parser'),
  express = require('express'),
  app = express(),
  config = require('../config'),
  path = require('path'),
  pg = require('pg');

pg.defaults.ssl = true;

const connectionString = 'postgres://cnbhxmeyfyjcfp:a4553501856b8d1c75ffcebe71813d7944a450951000001d4338ae18c82996cf@ec2-23-23-186-157.compute-1.amazonaws.com:5432/ddl66s5tol0c9g';

// pg.connect(connectionString, function(err, client) {  // process.env.DATABASE_URL
//   if (err) throw err;
//   console.log('Connected to postgres! Getting schemas...');  

//   client
//     /*
//     * To get a list of all schemas in postgres database = select * from pg_namespace
//     */
//     // .query('SELECT table_schema, table_name FROM information_schema.tables;') <= Ejemplo de Heroku.
//     // .query('CREATE SCHEMA schema_mleal AUTHORIZATION cnbhxmeyfyjcfp;') // <= User from heroku credentials.
//     // .query('CREATE TABLE users(id SERIAL PRIMARY KEY, name VARCHAR(15) not null)') <= Created users table.
//     .on('row', function(row) {
//       console.log(JSON.stringify(row));
//     });
// });

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(obj, done) {
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
  }, function(accessToken, refreshToken, profile, done) {
    process.nextTick(function () {
      //Check whether the User exists or not using profile.id
      if(config.use_database==='true') {
        connection.query("SELECT * from user_info where user_id="+profile.id,function(err,rows,fields){
          if(err) throw err;
          if(rows.length===0) {
            console.log("There is no such user, adding now");
            connection.query("INSERT into user_info(user_id,user_name) VALUES('"+profile.id+"','"+profile.username+"')");
          } else {
            console.log("User already exists in database");
          }
        });
      }
      return done(null, profile);
    });
  }
));

app.set('port', (process.env.PORT || 5000));

app.use(express.static(path.join(__dirname, '../public')));

// views is directory for all template files
app.set('views', path.join(__dirname, '../views'));
app.set('view engine', 'ejs');
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(session({ secret: 'keyboard cat', key: 'sid'}));
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', function(request, response) {
  response.render('pages/index');
});

// Verify functionallity with curl like so: curl --data "name=test" http://127.0.0.1:5000/api/users
app.post('/api/users', (req, res, next) => {
  const results = [];
  // Grab data from http request
  const data = {name: req.body.name};
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Insert Data
    client.query('INSERT INTO users(name) values($1)', [data.name]);
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM users ORDER BY id ASC');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.get('/api/users', (req, res, next) => {
  const results = [];
  // Get a Postgres client from the connection pool
  pg.connect(connectionString, (err, client, done) => {
    // Handle connection errors
    if(err) {
      done();
      console.log(err);
      return res.status(500).json({success: false, data: err});
    }
    // SQL Query > Select Data
    const query = client.query('SELECT * FROM users ORDER BY id ASC;');
    // Stream results back one row at a time
    query.on('row', (row) => {
      results.push(row);
    });
    // After all data is returned, close connection and return results
    query.on('end', () => {
      done();
      return res.json(results);
    });
  });
});

app.get('/app', function(req, res) {
  res.render('pages/app-form');
});

app.get('/user', function(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.send(JSON.stringify(  
    { 
      user: 'Mauricio' 
    }
  ));
});

app.post('/app-form-submit', function(req, res) {
  res.locals.firstName = req.body.firstName;
  res.locals.email = req.body.email;
  res.render('pages/app-form-submit');
});

/*
* Facebook Login.
* It only works locally
*/
app.get('/auth/facebook', passport.authenticate('facebook',{scope:'email'}));

app.get('/auth/facebook/callback',
  passport.authenticate('facebook', { successRedirect : '/datosFacebook', failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
});

app.get('/datosFacebook', function(req, res){

  console.log(`
    id: ${req.user.id}
    name: ${req.user.name.givenName}
    middle name: ${req.user.name.middleName}
    family name: ${req.user.name.familyName}
    emails: ${req.user.emails[0].value}
    provider: ${req.user.provider}
  `)
  res.redirect('/');
}); 
// <--- Facebook Login Ends --->


app.listen(app.get('port'), function() {
  console.log('Node app is running on port', app.get('port'));
});