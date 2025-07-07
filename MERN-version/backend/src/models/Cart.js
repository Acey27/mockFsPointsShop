import mongoose, { Schema } from 'mongoose';

const cartItemSchema = new Schema({
  productId: {
    type: Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [10, 'Quantity cannot exceed 10']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const cartSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    unique: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  lastUpdated: {
    type: Date,
    default: Date.now
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

// Update lastUpdated on save
cartSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Instance methods
cartSchema.methods.addItem = function(productId, quantity = 1) {
  const existingItemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );
  
  if (existingItemIndex > -1) {
    this.items[existingItemIndex].quantity = Math.min(
      this.items[existingItemIndex].quantity + quantity, 
      10
    );
  } else {
    this.items.push({ productId, quantity });
  }
  
  return this.save();
};

cartSchema.methods.updateItemQuantity = function(productId, quantity) {
  const itemIndex = this.items.findIndex(
    item => item.productId.toString() === productId.toString()
  );
  
  if (itemIndex > -1) {
    if (quantity <= 0) {
      this.items.splice(itemIndex, 1);
    } else {
      this.items[itemIndex].quantity = Math.min(quantity, 10);
    }
  }
  
  return this.save();
};

cartSchema.methods.removeItem = function(productId) {
  this.items = this.items.filter(
    item => item.productId.toString() !== productId.toString()
  );
  
  return this.save();
};

cartSchema.methods.clearCart = function() {
  this.items = [];
  return this.save();
};

cartSchema.methods.getTotal = async function() {
  await this.populate('items.productId', 'pointsCost');
  
  return this.items.reduce((total, item) => {
    return total + (item.productId.pointsCost * item.quantity);
  }, 0);
};

// Static methods
cartSchema.statics.findByUserId = async function(userId) {
  try {
    const cart = await this.findOne({ userId })
      .populate({
        path: 'items.productId',
        select: 'name description image pointsCost category inventory isActive'
      });
    
    if (cart) {
      // Filter out items where productId is null (products that don't exist)
      const originalLength = cart.items.length;
      cart.items = cart.items.filter(item => item.productId && item.productId._id);
      
      // If we filtered out items, save the cart
      if (cart.items.length !== originalLength) {
        await cart.save();
      }
    }
    
    return cart;
  } catch (error) {
    console.error('Cart findByUserId error:', error);
    throw error;
  }
};

cartSchema.statics.createOrUpdate = async function(userId, productId, quantity) {
  let cart = await this.findOne({ userId });
  
  if (!cart) {
    cart = new this({ userId, items: [] });
  }
  
  await cart.addItem(productId, quantity);
  return cart;
};

export const Cart = mongoose.model('Cart', cartSchema);
export default Cart;
