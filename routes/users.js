var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Story = require("../models/stories");
const { checkBody } = require("../modules/checkBody");
const uid2 = require("uid2");
const bcrypt = require("bcrypt");

// ROUTE SIGN UP

router.post("/signup", async (req, res) => {
  const { email, username, password } = req.body;
  if (!checkBody(req.body, ["email", "username", "password"])) {
    return res.json({ result: false, error: "Champ(s) vide(s)" });
  }

  // Vérification de l'email
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+.[a-zA-Z]{2,}$/;
  const isValidEmail = (email) => emailRegex.test(email);
  if (!isValidEmail(email)) return res.json({ result: false, error: "Email invalide" });

  try {
    // Vérification si l'email existe dans la BDD
    const user = await User.findOne({ email: email });
    if (user) return res.json({ result: false, error: "Email déjà existant" });

    const hash = bcrypt.hashSync(password, 10);

    const newUser = User({
      email,
      username,
      password: hash,
      token: uid2(32),
      recently_played: [],
    });
    const savedUser = await newUser.save();
    if (!savedUser)
      return res.json({ result: false, message: "Erreur lors de la création du user" });

    res.json({
      result: true,
      data: {
        username: newUser.username,
        token: newUser.token,
        email: newUser.email,
        recently_played: newUser.recently_played,
      },
    });
  } catch (error) {
    res.json({ result: false, error, message: "catch" });
  }
});

// ROUTE SIGN IN
router.post("/signin", async (req, res) => {
  const { password } = req.body;
  if (!checkBody(req.body, ["email", "password"])) {
    return res.json({ result: false, error: "Champ(s) vide(s)" });
  }

  try {
    const user = await User.findOne({ email: req.body.email }).populate("recently_played");
    if (user === null) return res.json({ result: false, error: "Email incorrect" });

    const { username, token, email, recently_played } = user;
    if (user && bcrypt.compareSync(password, user.password)) {
      const createdStories = await Story.find({ author: user._id })
        .populate("author")
        .populate("label")
        .populate("like");

      const likedStories = await Story.find({
        like: { $in: [user._id] },
      })
        .populate("author")
        .populate("label")
        .populate("like");

      console.log("liked");

      res.json({
        result: true,
        data: {
          user: {
            username,
            token,
            email,
            recently_played,
          },
          createdStories,
          likedStories,
        },
      });
    } else {
      res.json({ result: false, error: "Mauvais mot de passe" });
    }
  } catch (error) {
    res.json({ result: false, error, message: "catch" });
  }
});

module.exports = router;
