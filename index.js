const express = require("express");
const mysql = require("mysql");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const https = require("https");
const fs = require("fs");
const path = require("path");

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

// USER REQUESTS
// Obtener todos los usuarios
app.get("/users", (req, res) => {
  const getUsersSQL = "SELECT * FROM Usuario ORDER BY nickName ASC";

  connection.query(getUsersSQL, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).send("Vaya... el contenido que buscas no existe.");
    }
  });
});

// Obtener usuario por nickName
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
      res.status(404).json({
        response: "Usuario no encontrado...",
      });
    } else {
      if (bcrypt.compareSync(usuarioObj.password, result[0].password)) {
        res.sendStatus(200);
      } else {
        res.sendStatus(401);
      }
    }
  });
});

// Obtener todos los portfolios
app.get("/portfolios", (req, res) => {
  const getPortfoliosSQL = "SELECT * FROM Portfolio ORDER BY nickName ASC";

  connection.query(getPortfoliosSQL, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).send("Vaya... el contenido que buscas no existe.");
    }
  });
});

// Obtener portfolio por nickName
app.get("/portfolios/:nick", (req, res) => {
  const { nick } = req.params;

  const getOnePortfolioSQL = `SELECT coinSymbol FROM Portfolio WHERE nickName = "${nick}"`;

  connection.query(getOnePortfolioSQL, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Contenido no encontrado...");
    }
  });
});

// Obtener moneda del portfolio del usuario
app.get("/portfolios/:nick/:coin", (req, res) => {
  const { nick } = req.params;
  const { coin } = req.params;

  const getCoinSQL = `SELECT coinSymbol FROM Portfolio WHERE coinSymbol = "${coin}" AND nickName = "${nick}"`;

  connection.query(getCoinSQL, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Contenido no encontrado...");
    }
  });
});

// Añadir moneda al portfolio
app.post("/addCoin", (req, res) => {
  const addCoinObj = {
    nickName: req.body.nickName,
    coinSymbol: req.body.coinSymbol,
  };

  const checkCoinSQL =
    "SELECT * FROM Portfolio WHERE coinSymbol = '" +
    addCoinObj.coinSymbol +
    "' AND nickName = '" +
    addCoinObj.nickName +
    "'";
  const addCoinSQL = "INSERT INTO Portfolio SET ?";

  connection.query(checkCoinSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      res.sendStatus(409);
    } else {
      connection.query(addCoinSQL, addCoinObj, (error) => {
        if (error) throw error;
        res.sendStatus(201);
      });
    }
  });
});

// Obtener portfolio por nickName
app.get("/portfolios/:nick/:coin", (req, res) => {
  const { nick } = req.params;
  const { coin } = req.params;

  const getCoinSQL = `SELECT coinSymbol FROM Portfolio WHERE coinSymbol = "${coin}" AND nickName = "${nick}"`;

  connection.query(getCoinSQL, (err, result) => {
    if (err) throw err;
    if (result.length > 0) {
      res.status(200).json(result);
    } else {
      res.status(404).send("Contenido no encontrado...");
    }
  });
});

// Eliminar moneda del portfolio
app.delete("/delCoin/:nick/:coin", (req, res) => {
  const { nick } = req.params;
  const { coin } = req.params;

  const checkCoinSQL = `SELECT coinSymbol FROM Portfolio WHERE coinSymbol = "${coin}" AND nickName = "${nick}"`;
  const delCoinSQL = `DELETE FROM Portfolio WHERE coinSymbol = "${coin}" AND nickName = "${nick}"`;

  connection.query(checkCoinSQL, (error, result) => {
    if (error) throw error;
    if (result.length > 0) {
      connection.query(delCoinSQL, (error) => {
        if (error) throw error;
        res.status(200).send("¡Moneda eliminada correctamente!");
      });
    } else {
      res.status(404).json({
        response: "Moneda no encontrada...",
      });
    }
  });
});

// ADMIN REQUESTS
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

// Show stats
// Top 3 países más registrados
app.get("/coinStats", (req, res) => {
  const top3CoinsSQL =
    "SELECT coinSymbol FROM Portfolio GROUP BY coinSymbol ORDER BY count(coinSymbol) DESC LIMIT 3";

  connection.query(top3CoinsSQL, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).send("Vaya... el contenido que buscas no existe.");
    }
  });
});

// Top 3 países más registrados
app.get("/countryStats", (req, res) => {
  const top3CountriesSQL =
    "SELECT country FROM Usuario GROUP BY country ORDER BY count(country) DESC LIMIT 3";

  connection.query(top3CountriesSQL, (err, results) => {
    if (err) throw err;
    if (results.length > 0) {
      res.status(200).json(results);
    } else {
      res.status(404).send("Vaya... el contenido que buscas no existe.");
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
    key: fs.readFileSync(path.resolve("./security/key.pem")),
    cert: fs.readFileSync(path.resolve("./security/cert.pem")),
  },
  app
);

sslServer.listen(PORT, () => console.log(`Server listening on port ${PORT}`));

// Export the Express API
module.exports = app;
