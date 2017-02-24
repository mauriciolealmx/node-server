import config from '../../config';
import pg from 'pg';
import Promise from 'bluebird';

const connectionString = config.connectionString;

let createUser = (req, res) => {
  return new Promise(function(resolve, reject) {
    const results = [];
    // Grab data from http request
    const data = {name: req.body.user};
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
        return resolve(results);
      });
    });
  });
};
let getUsers = () => {
  return new Promise(function(resolve, reject) {

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
        return resolve(results);
      });
    });
  });
};
let updateUser = (req, res) => {
  return new Promise(function(resolve, reject) {
    const results = [];
    // Grab data from the URL parameters
    const id = req.params.user_id;
    const name = req.params.user_name;
    const data = {name};
    // Grab data from http request
    // Get a Postgres client from the connection pool
    pg.connect(connectionString, (err, client, done) => {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }
      // SQL Query > Update Data
      client.query('UPDATE users SET name=($1) WHERE id=($2)',
      [data.name, id]);
      // SQL Query > Select Data
      const query = client.query("SELECT * FROM users ORDER BY id ASC");
      // Stream results back one row at a time
      query.on('row', (row) => {
        results.push(row);
      });
      // After all data is returned, close connection and return results
      query.on('end', function() {
        done();
        return resolve(results);
      });
    });
  });
}

module.exports = function (app, express) {

  // PostgreSQL 
  pg.defaults.ssl = true;
    // Query Strings:
      // .query('select * from pg_namespace;') <= get a list of all schemas in postgres database
      // .query('SELECT table_schema, table_name FROM information_schema.tables;') <= Ejemplo de Heroku.
      // .query('CREATE SCHEMA schema_mleal AUTHORIZATION cnbhxmeyfyjcfp;') //  cnbhxmeyfyjcfp <= User from heroku credentials.
      // .query('CREATE TABLE users(id SERIAL PRIMARY KEY, name VARCHAR(15) not null)') <= Created users table.

  app.get('/api', function(req, res) {
    res.locals.results = undefined;
    res.locals.maxResults = undefined;
    res.render('pages/api');
  });

  app.post('/api', function(req, res) {
    res.locals.maxResults = undefined;
    if (req.body.action === 'POST') {
      createUser(req, res).then( (response) => {
        let lastUser = [];
        lastUser.push(response.pop());
        res.locals.results = lastUser;
        res.render('pages/api');
      });
    }  
    if (req.body.action === 'GET') {
      getUsers(req, res).then( (response) => {
        const MAX_RESULTS_TO_SHOW = 10;

        let block = [0, MAX_RESULTS_TO_SHOW];
        let slicedResponse = response.slice(...block);

        res.locals.maxResults = MAX_RESULTS_TO_SHOW;
        res.locals.results = slicedResponse;
        res.render('pages/api');
      });
    }
  });
      
  // Verify functionallity with curl like so: curl --data "user=test" http://127.0.0.1:5000/api/users
  app.post('/api/users', (req, res) => {
    createUser(req, res).then(function(response) {
      return res.json(response);
    });
  });

  app.get('/api/users', (req, res) => {
    getUsers().then(function(response) {
      return res.json(response);
    });
  });

  app.put('/api/users/:user_id/:user_name', (req, res, next) => {
    const id = req.params.user_id;

    updateUser(req, res).then( (response) => {
      return res.json(response);
    });
  });

  app.delete('/api/users/:user_id', (req, res, next) => {
    const results = [];
    // Grab data from the URL parameters
    const id = req.params.user_id;
    // Get a Postgres client from the connection pool
    pg.connect(connectionString, (err, client, done) => {
      // Handle connection errors
      if(err) {
        done();
        console.log(err);
        return res.status(500).json({success: false, data: err});
      }
      // SQL Query > Delete Data
      client.query('DELETE FROM users WHERE id=($1)', [id]);
      // SQL Query > Select Data
      var query = client.query('SELECT * FROM users ORDER BY id ASC');
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
}