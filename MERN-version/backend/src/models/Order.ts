import mongoose, { Schema, Document, Model } from 'mongoose';
import { IUser } from './User.js';
import { IProduct } from './Product.js';

export interface IOrderItem {
  productId: mongoose.Types.ObjectId | IProduct;
  quantity: number;
  pointsCostPerItem: number;
  totalPoints: number;
}

export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId | IUser;
  orderNumber?: string;
  items: IOrderItem[];
  totalPoints: number;
  status: 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';
  shippingAddress?: {
    name: string;
    email: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  notes?: string;
  processedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderModel extends Model<IOrder> {
  findByUserId(
    userId: string | mongoose.Types.ObjectId,
    options?: { limit?: number; skip?: number; status?: string }
  ): Promise<IOrder[]>;
  findByStatus(status: string): Promise<IOrder[]>;
  createOrder(
    userId: string | mongoose.Types.ObjectId,
    items: Array<{
      productId: string | mongoose.Types.ObjectId;
      quantity: number;
    }>,
    shippingAddress?: any
  ): Promise<IOrder>;
  updateStatus(
    orderId: string | mongoose.Types.ObjectId,
    status: string
  ): Promise<IOrder | null>;
}

const orderItemSchema = new Schema<IOrderItem>({
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
    min: [1, 'Points cost must be at least 1']
  },
  totalPoints: {
    type: Number,
    required: [true, 'Total points is required'],
    min: [1, 'Total points must be at least 1']
  }
}, { _id: false });

const shippingAddressSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  address: {
    type: String,
    required: [true, 'Address is required'],
    trim: true,
    maxlength: [200, 'Address cannot exceed 200 characters']
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true,
    maxlength: [50, 'City cannot exceed 50 characters']
  },
  state: {
    type: String,
    required: [true, 'State is required'],
    trim: true,
    maxlength: [50, 'State cannot exceed 50 characters']
  },
  zipCode: {
    type: String,
    required: [true, 'Zip code is required'],
    trim: true,
    maxlength: [20, 'Zip code cannot exceed 20 characters']
  },
  country: {
    type: String,
    required: [true, 'Country is required'],
    trim: true,
    default: 'United States',
    maxlength: [50, 'Country cannot exceed 50 characters']
  }
}, { _id: false });

const orderSchema = new Schema<IOrder, OrderModel>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required'],
    
  },
  orderNumber: {
    type: String,
    unique: true,
    sparse: true,
    trim: true,
    maxlength: [50, 'Order number cannot exceed 50 characters']
  },
  items: {
    type: [orderItemSchema],
    required: [true, 'Order items are required'],
    validate: {
      validator: function(items: IOrderItem[]) {
        return items && items.length > 0;
      },
      message: 'Order must have at least one item'
    }
  },
  totalPoints: {
    type: Number,
    required: [true, 'Total points is required'],
    min: [1, 'Total points must be at least 1']
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled', 'refunded'],
    default: 'pending',
    
  },
  shippingAddress: {
    type: shippingAddressSchema,
    default: null
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
    transform: function(doc: any, ret: any) {
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
orderSchema.pre('save', function(next: any) {
  const calculatedTotal = this.items.reduce((sum: number, item: IOrderItem) => {
    return sum + item.totalPoints;
  }, 0);
  
  if (Math.abs(this.totalPoints - calculatedTotal) > 0.01) {
    const error = new Error('Total points must match sum of item totals');
    return next(error);
  }
  
  next();
});

// Static method to find orders by user ID
orderSchema.statics.findByUserId = function(
  userId: string | mongoose.Types.ObjectId,
  options: { limit?: number; skip?: number; status?: string } = {}
) {
  const { limit = 20, skip = 0, status } = options;
  
  const query: any = { userId };
  if (status) {
    query.status = status;
  }
  
  return this.find(query)
    .populate('userId', 'name email department')
    .populate('items.productId', 'name image category')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip(skip);
};

// Static method to find orders by status
orderSchema.statics.findByStatus = function(status: string) {
  return this.find({ status })
    .populate('userId', 'name email department')
    .populate('items.productId', 'name image category pointsCost')
    .sort({ createdAt: -1 });
};

// Static method to create a new order
orderSchema.statics.createOrder = async function(
  userId: string | mongoose.Types.ObjectId,
  items: Array<{
    productId: string | mongoose.Types.ObjectId;
    quantity: number;
  }>,
  shippingAddress?: any
) {
  // Import Product model (avoiding circular dependency)
  const Product = mongoose.model('Product');
  
  // Validate and calculate order items
  const orderItems: IOrderItem[] = [];
  let totalPoints = 0;
  
  for (const item of items) {
    const product = await Product.findById(item.productId);
    if (!product) {
      throw new Error(`Product not found: ${item.productId}`);
    }
    
    if (!product.isActive) {
      throw new Error(`Product is not available: ${product.name}`);
    }
    
    if (product.inventory < item.quantity) {
      throw new Error(`Insufficient inventory for product: ${product.name}`);
    }
    
    const itemTotal = product.pointsCost * item.quantity;
    totalPoints += itemTotal;
    
    orderItems.push({
      productId: product._id,
      quantity: item.quantity,
      pointsCostPerItem: product.pointsCost,
      totalPoints: itemTotal
    });
  }
  
  // Create the order
  const order = await this.create({
    userId,
    items: orderItems,
    totalPoints,
    shippingAddress,
    status: 'pending'
  });
  
  return order;
};

// Static method to update order status
orderSchema.statics.updateStatus = async function(
  orderId: string | mongoose.Types.ObjectId,
  status: string
) {
  const order = await this.findById(orderId);
  if (!order) {
    throw new Error('Order not found');
  }
  
  order.status = status as any;
  return await order.save();
};

export const Order = mongoose.model<IOrder, OrderModel>('Order', orderSchema);
export default Order;
