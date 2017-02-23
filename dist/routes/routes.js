'use strict';

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var connectionString = _config2.default.connectionString;

var createUser = function createUser(req, res) {
  return new _bluebird2.default(function (resolve, reject) {
    var results = [];
    // Grab data from http request
    var data = { name: req.body.user };
    // Get a Postgres client from the connection pool
    _pg2.default.connect(connectionString, function (err, client, done) {
      // Handle connection errors
      if (err) {
        done();
        console.log(err);
        return res.status(500).json({ success: false, data: err });
      }
      // SQL Query > Insert Data
      client.query('INSERT INTO users(name) values($1)', [data.name]);
      // SQL Query > Select Data
      var query = client.query('SELECT * FROM users ORDER BY id ASC');
      // Stream results back one row at a time
      query.on('row', function (row) {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', function () {
        done();
        return resolve(results);
      });
    });
  });
};
var getUsers = function getUsers() {
  return new _bluebird2.default(function (resolve, reject) {

    var results = [];
    // Get a Postgres client from the connection pool
    _pg2.default.connect(connectionString, function (err, client, done) {
      // Handle connection errors
      if (err) {
        done();
        console.log(err);
        return res.status(500).json({ success: false, data: err });
      }
      // SQL Query > Select Data
      var query = client.query('SELECT * FROM users ORDER BY id ASC;');
      // Stream results back one row at a time
      query.on('row', function (row) {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', function () {
        done();
        return resolve(results);
      });
    });
  });
};

module.exports = function (app, express) {

  // PostgreSQL 
  _pg2.default.defaults.ssl = true;
  // Query Strings:
  // .query('select * from pg_namespace;') <= get a list of all schemas in postgres database
  // .query('SELECT table_schema, table_name FROM information_schema.tables;') <= Ejemplo de Heroku.
  // .query('CREATE SCHEMA schema_mleal AUTHORIZATION cnbhxmeyfyjcfp;') //  cnbhxmeyfyjcfp <= User from heroku credentials.
  // .query('CREATE TABLE users(id SERIAL PRIMARY KEY, name VARCHAR(15) not null)') <= Created users table.

  app.get('/api', function (req, res) {
    res.locals.results = undefined;
    res.render('pages/api');
  });

  app.post('/api', function (req, res) {
    console.log('req.body.action ', req.body.action);
    console.log('req.body.user ', req.body.user);
    if (req.body.action === 'POST') {
      createUser(req, res).then(function (response) {
        var lastUser = [];
        lastUser.push(response.pop());
        res.locals.results = lastUser;
        res.render('pages/api');
      });
    }
    if (req.body.action === 'GET') {
      getUsers(req, res).then(function (response) {
        res.locals.results = response;
        res.render('pages/api');
      });
    }
  });

  // Verify functionallity with curl like so: curl --data "user=test" http://127.0.0.1:5000/api/users
  app.post('/api/users', function (req, res) {
    createUser(req, res).then(function (response) {
      return res.json(response);
    });
  });

  app.get('/api/users', function (req, res) {
    getUsers().then(function (response) {
      return res.json(response);
    });
  });

  app.put('/api/users/:user_id', function (req, res, next) {
    var results = [];
    // Grab data from the URL parameters
    var id = req.params.user_id;
    // Grab data from http request
    var data = { name: req.body.user };
    // Get a Postgres client from the connection pool
    _pg2.default.connect(connectionString, function (err, client, done) {
      // Handle connection errors
      if (err) {
        done();
        console.log(err);
        return res.status(500).json({ success: false, data: err });
      }
      // SQL Query > Update Data
      client.query('UPDATE users SET name=($1) WHERE id=($2)', [data.name, id]);
      // SQL Query > Select Data
      var query = client.query("SELECT * FROM users ORDER BY id ASC");
      // Stream results back one row at a time
      query.on('row', function (row) {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', function () {
        done();
        return res.json(results);
      });
    });
  });

  app.delete('/api/users/:user_id', function (req, res, next) {
    var results = [];
    // Grab data from the URL parameters
    var id = req.params.user_id;
    // Get a Postgres client from the connection pool
    _pg2.default.connect(connectionString, function (err, client, done) {
      // Handle connection errors
      if (err) {
        done();
        console.log(err);
        return res.status(500).json({ success: false, data: err });
      }
      // SQL Query > Delete Data
      client.query('DELETE FROM users WHERE id=($1)', [id]);
      // SQL Query > Select Data
      var query = client.query('SELECT * FROM users ORDER BY id ASC');
      // Stream results back one row at a time
      query.on('row', function (row) {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', function () {
        done();
        return res.json(results);
      });
    });
  });
};