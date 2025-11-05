var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");
const User = require("../models/users");

//ROUTE POUR MODIFIER LE ROLE DU USER
router.post("/modify", async (req, res) => {
    const { token, role } = req.body;
    if (!checkBody(req.body, ["token", "role"])) {
        return res.json({ result: false, error: "Champ(s) vide(s)" });
    }
    try {
        const user = await User.findOne({ token: token })
        if (!user) return res.json({ result: false, message: "Aucun user trouvé" })
        if (user.role === role) return res.json({ result: false, message: "Vous êtes déjà abonné ! " })
        user.role = role;
        await user.save()
        res.json({ result: true, message: "Merci pour votre abonnement ! Bon dodo " })
    } catch (error) {
        res.json({ result: false, error: error.message });
    }
})

// ROUTE POUR RECUPERER LE ROLE DU USER
router.post("/get", async (req, res) => {
    const { token } = req.body;
    if (!checkBody(req.body, ["token"])) {
        return res.json({ result: false, error: "Manque le token de l'utilisateur" });
    }
    try {
        const user = await User.findOne({ token: token })
        if (!user) return res.json({ result: false, error: "Aucun user trouvé" })
        return res.json({ result: true, role: user.role })
    } catch (error) {
        res.json({ result: false, error: error.message });
    }
})


module.exports = router;