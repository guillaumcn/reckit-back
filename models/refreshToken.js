var mongoose = require('mongoose');
var ObjectId = mongoose.Schema.ObjectId;

var refreshTokenSchema = mongoose.Schema({
    refreshToken: String,
    expiration: Number,
    user: ObjectId
});
var RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;