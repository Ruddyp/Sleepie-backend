const mongoose = require('mongoose');


const categoriesSchema = mongoose.Schema({
    name: { type: String, required: true },
    stories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'stories', default: [] }],
});

const Category = mongoose.model('categories', categoriesSchema);

module.exports = Category;  