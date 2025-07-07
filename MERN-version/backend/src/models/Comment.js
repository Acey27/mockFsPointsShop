import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  cheerID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Cheer',
    required: true
  },
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
commentSchema.index({ cheerID: 1, createdAt: -1 });
commentSchema.index({ fromUser: 1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
