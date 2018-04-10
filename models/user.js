var mongoose = require('mongoose');

var userSchema = mongoose.Schema({
    email: { type: String, unique: true },
    password: String,
    lastActivity: Date
});
var User = mongoose.model('User', userSchema);

module.exports = User;