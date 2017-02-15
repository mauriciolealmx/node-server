'use strict';

var _config = require('../../config');

var _config2 = _interopRequireDefault(_config);

var _pg = require('pg');

var _pg2 = _interopRequireDefault(_pg);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var connectionString = _config2.default.connectionString;

module.exports = function (app, express) {
  // Verify functionallity with curl like so: curl --data "name=test" http://127.0.0.1:5000/api/users
  app.post('/api/users', function (req, res, next) {
    var results = [];
    // Grab data from http request
    var data = { name: req.body.name };
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
        return res.json(results);
      });
    });
  });

  app.get('/api/users', function (req, res, next) {
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
        return res.json(results);
      });
    });
  });

  app.put('/api/users/:user_id', function (req, res, next) {
    var results = [];
    // Grab data from the URL parameters
    var id = req.params.user_id;
    // Grab data from http request
    var data = { name: req.body.name };
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