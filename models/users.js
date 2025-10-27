const mongoose = require('mongoose');

const userSchema = mongoose.Schema({
    email: { type: String, required: true },
    username: { type: String, required: true },
    password: { type: String, required: true },
    token: { type: String, required: true },
    rôle: { type: String, default: "user" },
    recently_played: [{ type: mongoose.Schema.Types.ObjectId, ref: 'stories', required: true }],
});

const User = mongoose.model('users', userSchema);

module.exports = User;