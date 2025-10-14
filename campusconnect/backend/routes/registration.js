const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  phone: {
    type: String
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  paymentStatus: {
    type: String,
    enum: ['free', 'paid', 'pending', 'failed'],
    default: 'free'
  },
  paymentIntentId: {
    type: String
  },
  amountPaid: {
    type: Number,
    default: 0
  },
  ticketSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});


registrationSchema.index({ event: 1, email: 1 }, { unique: true });

// module.exports = mongoose.model('Registration', registrationSchema);
// ✅ Prevent OverwriteModelError on reload
module.exports = mongoose.models.Registration || mongoose.model('Registration', registrationSchema);
