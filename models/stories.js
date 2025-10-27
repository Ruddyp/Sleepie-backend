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
    like: [{ type: mongoose.Schema.Types.ObjectId, ref: 'users', required: true }],
    listen_counter: { type: Number, required: true },
    label: [{ type: mongoose.Schema.Types.ObjectId, ref: 'categories' }],
    title: { type: String, required: true },
    configuration: { type: configurationSchema, required: true },

});

const Story = mongoose.model('stories', storySchema);

module.exports = Story;