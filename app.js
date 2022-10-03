const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const https = require("https");
const fs = require("fs");

const salt = bcrypt.genSaltSync(10);

const PORT = process.env.PORT || 3050;

const app = express();

app.use(cors());
app.use(bodyParser.json());

// MySQL
const connection = mysql.createConnection({
  host: "cryptoaholic-db.c3b8wmhf8pac.us-east-1.rds.amazonaws.com",
  user: "admin",
  password: "D3poH4rD?",
  database: "cryptoaholic",
});

// Página de inicio
app.get("/", (req, res) => {
  res.send("Cryptoaholic API running!");
});

// Obtener todos los usuarios
app.get("/users", (req, res) => {
  const getUsersSQL = "SELECT * FROM Usuario";

  connection.query(getUsersSQL, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).send("Vaya... el contenido que buscas no existe.");
    }
  });
});

// Obtener usuario por ID
app.get("/users/:nick", (req, res) => {
  const { nick } = req.params;

  const getOneUserSQL = `SELECT * FROM Usuario WHERE nickName = "${nick}"`;

  connection.query(getOneUserSQL, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Usuario no encontrado...");
    }
  });
});

// Registrar
app.post("/register", (req, res) => {
  const usuarioObj = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    nickName: req.body.nickName,
    email: req.body.email,
    password: req.body.password,
    phone: req.body.phone,
    birthday: req.body.birthday,
    country: req.body.country,
    gender: req.body.gender,
  };

  const registerSQL = "INSERT INTO Usuario SET ?";
  const checkUserSQL =
    "SELECT * FROM Usuario WHERE nickName = '" + usuarioObj.nickName + "'";

  connection.query(checkUserSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      res.sendStatus(409);
    } else {
      let hash = bcrypt.hashSync(usuarioObj.password, salt);
      usuarioObj.password = hash;
      connection.query(registerSQL, usuarioObj, (error) => {
        if (error) throw error;
        res.sendStatus(201);
      });
    }
  });
});

// Iniciar sesión
app.post("/login", (req, res) => {
  const usuarioObj = {
    nickName: req.body.nickName,
    password: req.body.password,
  };

  const loginSQL =
    "SELECT * FROM Usuario WHERE nickName = '" + usuarioObj.nickName + "'";

  connection.query(loginSQL, (error, result) => {
    if (error) throw error;
    if (result.length == 0) {
      res.status(401).json({
        response: "Usuario no encontrado...",
      });
    } else {
      if (bcrypt.compareSync(usuarioObj.password, result[0].password)) {
        res.sendStatus(200);
      } else {
        res.sendStatus(400);
      }
    }
  });
});

// Eliminar usuario
app.delete("/deleteUser/:nick", (req, res) => {
  const { nick } = req.params;

  const checkUserSQL = `SELECT * FROM Usuario WHERE nickName = "${nick}"`;
  const deleteSQL = `DELETE FROM Usuario WHERE nickName = "${nick}"`;

  connection.query(checkUserSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      connection.query(deleteSQL, (error) => {
        if (error) throw error;
        res.status(200).send("¡Usuario eliminado correctamente!");
      });
    } else {
      res.status(404).json({
        response: "Usuario no encontrado...",
      });
    }
  });
});

// Check connection
connection.connect((error) => {
  if (error) throw error;
  console.log("Database server running!");
});

const sslServer = https.createServer(
  {
    key: fs.readFileSync("./security/key.pem"),
    cert: fs.readFileSync("./security/cert.pem"),
  },
  app
);

sslServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Export the Express API
module.exports = app;
