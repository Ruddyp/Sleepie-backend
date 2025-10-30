const mongoose = require('mongoose');

const configurationSchema = mongoose.Schema({
    duration: { type: Number, required: true },
    speaker: { type: String, required: true },
    location: { type: String },
    character: [String],
});

const storySchema = mongoose.Schema({
    url: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true },
    created_at: { type: Date, required: true },
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users', default: [] }],
    listen_counter: { type: Number, default: 0 },
    label: [{ type: mongoose.Schema.Types.ObjectId, ref: 'categories', default: [] }],
    title: { type: String, required: true, default: "Histoire sans titre" },
    configuration: { type: configurationSchema, required: true },

});

const Story = mongoose.model('stories', storySchema);

module.exports = Story;