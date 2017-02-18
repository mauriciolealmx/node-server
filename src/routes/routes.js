import config from '../../config';
import pg from 'pg';

const connectionString = config.connectionString;

let createUser = (req, res) => {
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
      return res.json(results);
    });
  });
};

module.exports = function (app, express) {

  // PostgreSQL 
  pg.defaults.ssl = true;
    // Query Strings:
      // .query('select * from pg_namespace;') <= get a list of all schemas in postgres database
      // .query('SELECT table_schema, table_name FROM information_schema.tables;') <= Ejemplo de Heroku.
      // .query('CREATE SCHEMA schema_mleal AUTHORIZATION cnbhxmeyfyjcfp;') //  cnbhxmeyfyjcfp <= User from heroku credentials.
      // .query('CREATE TABLE users(id SERIAL PRIMARY KEY, name VARCHAR(15) not null)') <= Created users table.

  app.get('/api', function(req, res) {
    res.render('pages/api');
  });

  app.post('/chocolate', function(req, res) {
    console.log('req.body.action ', req.body.action);
    console.log('req.body.user ', req.body.user);
    if (req.body.action === 'POST') {
      createUser(req, res);
    }
  });
      
  // Verify functionallity with curl like so: curl --data "user=test" http://127.0.0.1:5000/api/users
  app.post('/api/users', (req, res) => {
    createUser(req, res);
  });

  app.get('/api/users', (req, res) => {
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

  app.put('/api/users/:user_id', (req, res, next) => {
    const results = [];
    // Grab data from the URL parameters
    const id = req.params.user_id;
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
        return res.json(results);
      });
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