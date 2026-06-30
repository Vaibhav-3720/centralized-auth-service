const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  token: {
    type: String,
    required: true,
    unique: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 } // TTL index set to 0, which tells MongoDB to delete the document when current time exceeds expiresAt
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
