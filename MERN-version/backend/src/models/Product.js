import mongoose, { Schema } from 'mongoose';

const productSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    maxlength: [100, 'Product name cannot exceed 100 characters'],
  },
  description: {
    type: String,
    required: [true, 'Product description is required'],
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  image: {
    type: String,
    required: [true, 'Product image is required'],
    validate: {
      validator: function(v) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(v);
      },
      message: 'Image must be a valid URL ending with jpg, jpeg, png, gif, or webp'
    }
  },
  pointsCost: {
    type: Number,
    required: [true, 'Points cost is required'],
    min: [1, 'Points cost must be at least 1'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    lowercase: true,
    enum: {
      values: ['apparel', 'accessories', 'electronics', 'office', 'giftcards', 'experiences', 'food', 'books'],
      message: 'Category must be one of: apparel, accessories, electronics, office, giftcards, experiences, food, books'
    },
  },
  inventory: {
    type: Number,
    required: [true, 'Inventory is required'],
    min: [0, 'Inventory cannot be negative'],
    default: 0,
  },
  rating: {
    type: Number,
    min: [0, 'Rating cannot be less than 0'],
    max: [5, 'Rating cannot be more than 5'],
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
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
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1, isActive: 1 });
productSchema.index({ pointsCost: 1, isActive: 1 });
productSchema.index({ rating: -1, isActive: 1 });
productSchema.index({ inventory: 1, isActive: 1 });
productSchema.index({ createdAt: -1 });

// Static method to find active products with filters
productSchema.statics.findActive = function(filters = {}) {
  const { category, minPoints, maxPoints, search } = filters;
  
  const query = { isActive: true };
  
  if (category && category !== 'all') {
    query.category = category;
  }
  
  if (minPoints !== undefined || maxPoints !== undefined) {
    query.pointsCost = {};
    if (minPoints !== undefined) query.pointsCost.$gte = minPoints;
    if (maxPoints !== undefined) query.pointsCost.$lte = maxPoints;
  }
  
  if (search) {
    query.$text = { $search: search };
  }
  
  return this.find(query).sort({ rating: -1, createdAt: -1 });
};

// Static method to find products by category
productSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category.toLowerCase(), 
    isActive: true,
    inventory: { $gt: 0 }
  }).sort({ rating: -1, pointsCost: 1 });
};

// Static method to update inventory
productSchema.statics.updateInventory = async function(productId, quantity) {
  const product = await this.findById(productId);
  if (!product) {
    throw new Error('Product not found');
  }
  
  if (product.inventory + quantity < 0) {
    throw new Error('Insufficient inventory');
  }
  
  product.inventory += quantity;
  return await product.save();
};

// Static method to check availability
productSchema.statics.checkAvailability = async function(productId, quantity) {
  const product = await this.findById(productId);
  if (!product) {
    return false;
  }
  
  return product.isActive && product.inventory >= quantity;
};

// Pre-save middleware to ensure rating is within bounds
productSchema.pre('save', function(next) {
  if (this.rating < 0) this.rating = 0;
  if (this.rating > 5) this.rating = 5;
  next();
});

export const Product = mongoose.model('Product', productSchema);
export default Product;
