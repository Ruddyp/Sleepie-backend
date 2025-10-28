var express = require('express');
var router = express.Router();

const User = require('../models/users');
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// ROUTE SIGN UP

router.post('/signup', (req, res) => {
  const { email, username, password } = req.body;
  if (!checkBody(req.body, ["email", "username", "password"])) {
    return res.json({ result: false, error: "Champ(s) vide(s)" });

  }

  // Vérification de l'email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/;
  const isValidEmail = (email) => emailRegex.test(email);
  if (!isValidEmail(email)) return res.json({ result: false, error: "Email invalide" })

  try {
    // Vérification si l'email existe dans la BDD
    User.findOne({ email: email }).then((data) => {
      if (data !== null) return res.json({ result: false, error: "Email déjà existant" })

      const hash = bcrypt.hashSync(password, 10);

      const newUser = User({
        email,
        username,
        password: hash,
        token: uid2(32),
        recently_played: [],
      });
      newUser.save().then((newUser) => {
        res.json({
          result: true,
          data: {
            username: newUser.username,
            token: newUser.token,
            email: newUser.email
          }
        })
      })
    })
  } catch (error) {
    res.json({ result: false, error, message: "catch" })
  }

})

// ROUTE SIGN IN
router.post('/signin', (req, res) => {
  const { email, password } = req.body;
  if (!checkBody(req.body, ["email", "password"])) {
    return res.json({ result: false, error: "Champ(s) vide(s)" });
  }
  try {
    User.findOne({ email: email }).then((data) => {
      if (data === null) return res.json({ result: false, error: "Email incorrect" });

      if (data && bcrypt.compareSync(password, data.password)) {
        res.json({
          result: true,
          data: {
            username: data.username,
            token: data.token,
            email: data.email
          }
        });
      } else {
        res.json({ result: false, error: "Mauvais mot de passe" });
      }

    });
  } catch (error) {
    res.json({ result: false, error, message: "catch" })
  }


})


module.exports = router;
