var express = require("express");
var router = express.Router();
const { checkBody } = require("../modules/checkBody");
const User = require("../models/users");

router.post("/modify", async (req, res) => {
    const { token, role } = req.body;
    if (!checkBody(req.body, ["token", "role"])) {
        return res.json({ result: false, error: "Champ(s) vide(s)" });
    }
    try {
        const user = await User.findOne({ token: token })
        if (!user) return res.json({ result: false, message: "Aucun user trouvé" })
        user.role = role;
        await user.save()
        res.json({ result: true, message: "rôle de l'utilisateur modifié avec succès ! " })
    } catch (error) {
        res.json({ result: false, error: error.message });
    }
})


module.exports = router;