import mongoose from 'mongoose';

const cheerSchema = new mongoose.Schema({
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  toUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  points: {
    type: Number,
    required: true,
    min: 1,
    max: 10,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
cheerSchema.index({ fromUser: 1, createdAt: -1 });
cheerSchema.index({ toUser: 1, createdAt: -1 });
cheerSchema.index({ createdAt: -1 });

// Prevent users from cheering themselves
cheerSchema.pre('save', function(next) {
  if (this.fromUser.equals(this.toUser)) {
    const error = new Error('Users cannot cheer themselves');
    return next(error);
  }
  next();
});

export const Cheer = mongoose.model('Cheer', cheerSchema);
