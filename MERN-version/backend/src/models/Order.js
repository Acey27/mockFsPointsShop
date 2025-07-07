import mongoose, { Schema } from 'mongoose';

const orderItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  pointsCostPerItem: {
    type: Number,
    required: [true, 'Points cost per item is required'],
    min: [0, 'Points cost cannot be negative']
  },
  totalPoints: {
    type: Number,
    required: [true, 'Total points is required'],
    min: [0, 'Total points cannot be negative']
  }
}, { _id: false });

const orderSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  orderNumber: {
    type: String,
    unique: true,
    sparse: true
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  totalPoints: {
    type: Number,
    required: [true, 'Total points is required'],
    min: [0, 'Total points cannot be negative']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending'
  },
  cancellationRequest: {
    requested: {
      type: Boolean,
      default: false
    },
    requestedAt: {
      type: Date,
      default: null
    },
    requestedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    reason: {
      type: String,
      trim: true,
      maxlength: [500, 'Cancellation reason cannot exceed 500 characters']
    },
    adminResponse: {
      type: String,
      enum: ['pending', 'approved', 'denied'],
      default: 'pending'
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters']
    },
    processedAt: {
      type: Date,
      default: null
    },
    processedBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  shippingAddress: {
    name: { type: String, trim: true },
    email: { type: String, trim: true },
    address: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    zipCode: { type: String, trim: true },
    country: { type: String, trim: true, default: 'US' }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [1000, 'Notes cannot exceed 1000 characters']
  },
  processedAt: {
    type: Date,
    default: null
  },
  metadata: {
    type: Schema.Types.Mixed,
    default: null
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Indexes for performance
orderSchema.index({ userId: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ createdAt: -1 });

// Pre-save validation to ensure totalPoints matches sum of item totals
orderSchema.pre('save', function(next) {
  const calculatedTotal = this.items.reduce((sum, item) => {
    return sum + item.totalPoints;
  }, 0);
  
  if (Math.abs(this.totalPoints - calculatedTotal) > 0.01) {
    const error = new Error('Total points must match sum of item totals');
    return next(error);
  }
  
  next();
});

// Generate order number before saving
orderSchema.pre('save', function(next) {
  if (this.isNew && !this.orderNumber) {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 5);
    this.orderNumber = `ORD-${timestamp}-${random}`.toUpperCase();
  }
  next();
});

// Static method to find orders by user ID
orderSchema.statics.findByUserId = function(userId, options = {}) {
  const { limit = 20, skip = 0, status } = options;
  
  const query = { userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('items.productId', 'name image pointsCost category')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status) {
  return this.find({ status })
    .populate('userId', 'name email department')
    .populate('items.productId', 'name image pointsCost category')
    .sort({ createdAt: -1 });
};

// Static method to create order
orderSchema.statics.createOrder = async function(userId, items, shippingAddress) {
  // Calculate total points
  const totalPoints = items.reduce((sum, item) => {
    return sum + (item.pointsCostPerItem * item.quantity);
  }, 0);
  
  const orderData = {
    userId,
    items: items.map(item => ({
      productId: item.productId,
      quantity: item.quantity,
      pointsCostPerItem: item.pointsCostPerItem,
      totalPoints: item.pointsCostPerItem * item.quantity
    })),
    totalPoints,
    shippingAddress
  };
  
  return this.create(orderData);
};

// Static method to update order status
orderSchema.statics.updateStatus = function(orderId, status, metadata) {
  const updateData = { status };
  
  if (status === 'processing' || status === 'completed') {
    updateData.processedAt = new Date();
  }
  
  if (metadata) {
    updateData.metadata = metadata;
  }
  
  return this.findByIdAndUpdate(orderId, updateData, { new: true });
};

export const Order = mongoose.model('Order', orderSchema);
export default Order;
