import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { Product, Order, UserPoints, Transaction } from '../models/index.js';
import { validateObjectId } from '../utils/validation.js';
import mongoose from 'mongoose';

const router = Router();

// Get all products (public - with auth for favorites/etc)
router.get('/products', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const category = req.query.category as string;
    const minPrice = parseInt(req.query.minPrice as string) || 0;
    const maxPrice = parseInt(req.query.maxPrice as string) || 999999;
    const sortBy = req.query.sortBy as string || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    let query: any = { 
      isActive: true,
      pointsCost: { $gte: minPrice, $lte: maxPrice }
    };

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (category) {
      query.category = category;
    }

    // Build sort object
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder;

    const products = await Product.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    // Get categories for filter
    const categories = await Product.distinct('category', { isActive: true });

    return res.json({
      status: 'success',
      data: products,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ 
      status: 'error',
      message: 'Server error',
      error: 'Failed to fetch products'
    });
  }
});

// Get single product
router.get('/products/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found' });
    }

    return res.json(product);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Purchase a product
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user!._id;

    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    if (quantity <= 0 || quantity > 10) {
      return res.status(400).json({ message: 'Quantity must be between 1 and 10' });
    }

    // Get product
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ message: 'Product not found or inactive' });
    }

    // Check stock
    if (product.inventory !== null && product.inventory < quantity) {
      return res.status(400).json({ message: 'Insufficient stock' });
    }

    // Calculate total cost
    const totalCost = product.pointsCost * quantity;

    // Get user points
    const userPoints = await UserPoints.findOne({ userId });
    if (!userPoints) {
      return res.status(400).json({ message: 'User points record not found' });
    }

    if (userPoints.availablePoints < totalCost) {
      return res.status(400).json({ 
        message: `Insufficient points. You need ${totalCost} points but have ${userPoints.availablePoints}` 
      });
    }

    // Start transaction
    const session = await Product.startSession();
    session.startTransaction();

    try {
      // Update user points
      userPoints.availablePoints -= totalCost;
      userPoints.totalSpent += totalCost;
      await userPoints.save({ session });

      // Update product stock
      if (product.inventory !== null) {
        product.inventory -= quantity;
        await product.save({ session });
      }

      // Create order
      const orderItems = [{
        productId,
        quantity,
        pointsCostPerItem: product.pointsCost,
        totalPoints: totalCost
      }];

      const order = new Order({
        userId,
        items: orderItems,
        totalPoints: totalCost,
        status: 'pending'
      });

      await order.save({ session });

      // Create transaction record
      const transaction = new Transaction({
        userId,
        type: 'purchase',
        amount: -totalCost,
        description: `Purchased ${quantity}x ${product.name}`,
        relatedOrderId: order._id,
        relatedProductId: productId,
        metadata: {
          productName: product.name,
          quantity,
          unitCost: product.pointsCost
        }
      });

      await transaction.save({ session });

      await session.commitTransaction();

      // Populate order with product details
      const populatedOrder = await Order.findById(order._id)
        .populate('items.productId', 'name description image category')
        .populate('userId', 'name email');

      return res.json({
        message: 'Purchase successful',
        order: populatedOrder,
        newBalance: userPoints.availablePoints
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error) {
    console.error('Purchase error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Get user's orders
router.get('/orders', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    let query: any = { userId: req.user!._id };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name description image category')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    return res.json({
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// GET USER'S ORDER HISTORY with receipts (must be before /:orderId route)
router.get('/orders/history', requireAuth, async (req, res) => {
  try {
    const userId = req.user!._id;
    const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;

    // Build query - ENSURE we filter by the current user only
    let query: any = { userId };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name description image category rating')
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Order.countDocuments(query);

    // Generate receipts for each order
    const ordersWithReceipts = orders.map(order => {
      const orderObj = order.toObject();
      const receipt = {
        receiptId: `RCP-${order._id}`,
        orderNumber: orderObj.orderNumber || `ORD-${order._id}`,
        orderId: order._id,
        timestamp: order.createdAt.toISOString(),
        items: order.items.map(item => {
          const product = item.productId as any;
          return {
            productId: product?._id || 'N/A',
            productName: product?.name || 'Product No Longer Available',
            category: product?.category || 'unknown',
            description: product?.description || 'This product is no longer available',
            image: product?.image || 'https://via.placeholder.com/400x300?text=Product+Not+Found',
            pointsCostPerItem: item.pointsCostPerItem,
            quantity: item.quantity,
            totalPoints: item.totalPoints
          };
        }),
        summary: {
          itemCount: order.items.length,
          totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
          total: order.totalPoints
        },
        status: order.status
      };

      return {
        ...orderObj,
        receipt
      };
    });

    return res.json({
      status: 'success',
      data: ordersWithReceipts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Order history error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order history'
    });
  }
});

// Get single order
router.get('/orders/:orderId', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;

    if (!orderId || !validateObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId)
      .populate('items.productId', 'name description image category')
      .populate('userId', 'name email');

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    // Check if user owns this order or is admin
    if (order.userId._id.toString() !== req.user!._id.toString() && req.user!.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Get all products
router.get('/admin/products', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    const search = req.query.search as string;
    const includeInactive = req.query.includeInactive === 'true';

    let query: any = {};
    if (!includeInactive) {
      query.isActive = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Product.countDocuments(query);

    return res.json({
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Create product
router.post('/admin/products', requireAdmin, async (req, res) => {
  try {
    const {
      name,
      description,
      pointsCost,
      category,
      image,
      inventory,
      isActive = true
    } = req.body;

    const product = new Product({
      name,
      description,
      pointsCost,
      category,
      image,
      inventory,
      isActive
    });

    await product.save();

    return res.status(201).json({
      message: 'Product created successfully',
      product
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Update product
router.patch('/admin/products/:productId', requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const {
      name,
      description,
      pointsCost,
      category,
      image,
      inventory,
      isActive
    } = req.body;

    // Update fields
    if (name !== undefined) product.name = name;
    if (description !== undefined) product.description = description;
    if (pointsCost !== undefined) product.pointsCost = pointsCost;
    if (category !== undefined) product.category = category;
    if (image !== undefined) product.image = image;
    if (inventory !== undefined) product.inventory = inventory;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    return res.json({
      message: 'Product updated successfully',
      product
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Delete product
router.delete('/admin/products/:productId', requireAdmin, async (req, res) => {
  try {
    const { productId } = req.params;

    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Soft delete
    product.isActive = false;
    await product.save();

    return res.json({
      message: 'Product deactivated successfully'
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Get all orders
router.get('/admin/orders', requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const page = Math.max(parseInt(req.query.page as string) || 1, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status as string;
    const search = req.query.search as string;

    let query: any = {};
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .populate('items.productId', 'name description image category')
      .populate('userId', 'name email department')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Filter by search if provided
    let filteredOrders = orders;
    if (search) {
      filteredOrders = orders.filter(order => 
        order._id.toString().includes(search) ||
        (order.userId as any).name.toLowerCase().includes(search.toLowerCase()) ||
        (order.userId as any).email.toLowerCase().includes(search.toLowerCase()) ||
        order.items.some((item: any) => 
          (item.productId as any).name.toLowerCase().includes(search.toLowerCase())
        )
      );
    }

    const total = await Order.countDocuments(query);

    return res.json({
      orders: filteredOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Update order status
router.patch('/admin/orders/:orderId', requireAdmin, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status, notes } = req.body;

    if (!orderId || !validateObjectId(orderId)) {
      return res.status(400).json({ message: 'Invalid order ID' });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const oldStatus = order.status;
    
    if (status) order.status = status;
    if (notes) order.notes = notes;

    await order.save();

    // If order was cancelled, refund points
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const userPoints = await UserPoints.findOne({ userId: order.userId });
      if (userPoints) {
        userPoints.availablePoints += order.totalPoints;
        userPoints.totalSpent -= order.totalPoints;
        await userPoints.save();

        // Create refund transaction
        const transaction = new Transaction({
          userId: order.userId,
          type: 'refund',
          amount: order.totalPoints,
          description: `Refund for cancelled order ${order._id}`,
          relatedOrderId: order._id,
          metadata: {
            originalOrderId: order._id,
            refundReason: 'Order cancelled by admin'
          }
        });

        await transaction.save();
      }
    }

    const updatedOrder = await Order.findById(orderId)
      .populate('items.productId', 'name description image category')
      .populate('userId', 'name email department');

    return res.json({
      message: 'Order updated successfully',
      order: updatedOrder
    });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// CHECKOUT - Process multiple items purchase with receipt generation
router.post('/checkout', requireAuth, async (req, res) => {
  try {
    const userId = req.user!._id;
    const { items, shippingAddress } = req.body;

    // Validate request
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Items array is required and cannot be empty'
      });
    }

    // Validate each item
    for (const item of items) {
      if (!item.productId || !item.quantity || item.quantity <= 0) {
        return res.status(400).json({
          status: 'error',
          message: 'Each item must have productId and positive quantity'
        });
      }
    }

    // Start database transaction
    const session = await mongoose.startSession();
    await session.startTransaction();

    try {
      // Get user points
      const userPoints = await UserPoints.findOne({ userId }).session(session);
      if (!userPoints) {
        await session.abortTransaction();
        return res.status(400).json({
          status: 'error',
          message: 'User points record not found'
        });
      }

      // Process each item and calculate totals
      const orderItems: any[] = [];
      const purchaseDetails: any[] = [];
      let grandTotal = 0;
      const productUpdates: Array<{productId: any, newInventory: number}> = [];

      for (const item of items) {
        const product = await Product.findById(item.productId).session(session);
        
        if (!product || !product.isActive) {
          await session.abortTransaction();
          return res.status(404).json({
            status: 'error',
            message: `Product not found or inactive: ${item.productId}`
          });
        }

        // Check inventory
        if (product.inventory !== null && product.inventory < item.quantity) {
          await session.abortTransaction();
          return res.status(400).json({
            status: 'error',
            message: `Insufficient stock for ${product.name}. Available: ${product.inventory}, Requested: ${item.quantity}`
          });
        }

        const itemTotal = product.pointsCost * item.quantity;
        grandTotal += itemTotal;

        // Prepare order item
        orderItems.push({
          productId: product._id,
          quantity: item.quantity,
          pointsCostPerItem: product.pointsCost,
          totalPoints: itemTotal
        });

        // Prepare purchase details for receipt
        purchaseDetails.push({
          productId: product._id,
          productName: product.name,
          category: product.category,
          description: product.description,
          image: product.image,
          pointsCostPerItem: product.pointsCost,
          quantity: item.quantity,
          totalPoints: itemTotal
        });

        // Prepare inventory update
        if (product.inventory !== null) {
          productUpdates.push({
            productId: product._id,
            newInventory: product.inventory - item.quantity
          });
        }
      }

      // Check if user has enough points
      if (userPoints.availablePoints < grandTotal) {
        await session.abortTransaction();
        return res.status(400).json({
          status: 'error',
          message: `Insufficient points. Required: ${grandTotal}, Available: ${userPoints.availablePoints}`,
          details: {
            required: grandTotal,
            available: userPoints.availablePoints,
            shortage: grandTotal - userPoints.availablePoints
          }
        });
      }

      // Generate order number
      const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

      // Create order
      const order = new Order({
        userId,
        orderNumber,
        items: orderItems,
        totalPoints: grandTotal,
        status: 'completed',
        shippingAddress,
        processedAt: new Date(),
        metadata: {
          paymentMethod: 'points',
          receiptGenerated: true
        }
      });

      await order.save({ session });

      // Update user points
      userPoints.availablePoints -= grandTotal;
      userPoints.totalSpent += grandTotal;
      userPoints.lastTransactionAt = new Date();
      await userPoints.save({ session });

      // Update product inventories
      for (const update of productUpdates) {
        await Product.findByIdAndUpdate(
          update.productId,
          { inventory: update.newInventory },
          { session }
        );
      }

      // Create comprehensive transaction records
      const transactions: any[] = [];

      // Main purchase transaction
      const mainTransaction = new Transaction({
        toUserId: userId,
        type: 'spent',
        amount: grandTotal,
        description: `Purchase order ${orderNumber} - ${orderItems.length} item(s)`,
        metadata: {
          orderId: order._id,
          orderNumber,
          itemCount: orderItems.length,
          purchaseDetails,
          transactionType: 'checkout'
        }
      });

      transactions.push(mainTransaction);

      // Individual item transactions for detailed tracking
      for (const detail of purchaseDetails) {
        const itemTransaction = new Transaction({
          toUserId: userId,
          type: 'spent',
          amount: detail.totalPoints,
          description: `${detail.quantity}x ${detail.productName}`,
          metadata: {
            orderId: order._id,
            orderNumber,
            productId: detail.productId,
            productName: detail.productName,
            category: detail.category,
            quantity: detail.quantity,
            unitCost: detail.pointsCostPerItem,
            transactionType: 'item_purchase'
          }
        });

        transactions.push(itemTransaction);
      }

      // Save all transactions
      await Transaction.insertMany(transactions, { session });

      await session.commitTransaction();

      // Generate detailed receipt
      const receipt = {
        receiptId: `RCP-${order._id}`,
        orderNumber,
        orderId: order._id,
        timestamp: new Date().toISOString(),
        customer: {
          name: req.user!.name,
          email: req.user!.email,
          userId: req.user!._id
        },
        items: purchaseDetails,
        summary: {
          itemCount: orderItems.length,
          totalQuantity: orderItems.reduce((sum: number, item: any) => sum + item.quantity, 0),
          subtotal: grandTotal,
          discount: 0,
          total: grandTotal
        },
        payment: {
          method: 'points',
          pointsUsed: grandTotal,
          previousBalance: userPoints.availablePoints + grandTotal,
          newBalance: userPoints.availablePoints
        },
        shippingAddress,
        status: 'completed'
      };

      return res.status(201).json({
        status: 'success',
        message: 'Purchase completed successfully',
        data: {
          order: await Order.findById(order._id)
            .populate('items.productId', 'name description image category rating')
            .populate('userId', 'name email department'),
          receipt,
          newBalance: userPoints.availablePoints,
          transactionIds: transactions.map((t: any) => t._id)
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error: any) {
    console.error('Checkout error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process checkout',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// GET SPECIFIC ORDER RECEIPT with detailed receipt
router.get('/orders/:orderId/receipt', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!._id;

    if (!orderId || !validateObjectId(orderId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findOne({ _id: orderId, userId })
      .populate('items.productId', 'name description image category rating')
      .populate('userId', 'name email department');

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Get related transactions
    const transactions = await Transaction.find({
      'metadata.orderId': orderId
    }).sort({ createdAt: -1 });

    // Generate detailed receipt
    const orderObj = order.toObject();
    const userObj = orderObj.userId as any;
    
    const receipt = {
      receiptId: `RCP-${order._id}`,
      orderNumber: orderObj.orderNumber || `ORD-${order._id}`,
      orderId: order._id,
      timestamp: order.createdAt.toISOString(),
      customer: {
        name: userObj?.name || 'Unknown',
        email: userObj?.email || 'Unknown',
        userId: userObj?._id || order.userId
      },
      items: order.items.map(item => {
        const productObj = item.productId as any;
        return {
          productId: productObj?._id || item.productId,
          productName: productObj?.name || 'Unknown Product',
          category: productObj?.category || 'Unknown',
          description: productObj?.description || '',
          image: productObj?.image || '',
          rating: productObj?.rating || 0,
          pointsCostPerItem: item.pointsCostPerItem,
          quantity: item.quantity,
          totalPoints: item.totalPoints
        };
      }),
      summary: {
        itemCount: order.items.length,
        totalQuantity: order.items.reduce((sum, item) => sum + item.quantity, 0),
        subtotal: order.totalPoints,
        discount: 0,
        total: order.totalPoints
      },
      payment: {
        method: 'points',
        pointsUsed: order.totalPoints
      },
      shippingAddress: order.shippingAddress,
      status: order.status,
      processedAt: orderObj.processedAt,
      transactions: transactions.map(t => ({
        id: t._id,
        type: t.type,
        amount: t.amount,
        description: t.description,
        createdAt: t.createdAt
      }))
    };

    return res.json({
      status: 'success',
      data: {
        order: orderObj,
        receipt,
        transactions
      }
    });

  } catch (error) {
    console.error('Order details error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order details'
    });
  }
});

export default router;
