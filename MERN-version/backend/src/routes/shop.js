import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { Product, Order, UserPoints, Transaction, Cart } from '../models/index.js';
import { validateObjectId } from '../utils/validation.js';
import mongoose from 'mongoose';

const router = Router();

// Get all products (public - with auth for favorites/etc)
router.get('/products', requireAuth, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const category = req.query.category;
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 999999;
    const sortBy = req.query.sortBy || 'createdAt';
    const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;

    // Build query
    const query= { 
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
    const sortObj= {};
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

// Cart management routes
// Get user's cart
router.get('/cart', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    let cart = await Cart.findByUserId(userId);
    
    if (!cart) {
      cart = { items: [], totalPoints: 0 };
    } else {
      // Calculate total points
      cart.totalPoints = await cart.getTotal();
    }
    
    return res.json({
      status: 'success',
      data: cart
    });
  } catch (error) {
    console.error('Get cart error:', error);
    return res.status(500).json({ 
      status: 'error', 
      message: 'Failed to fetch cart' 
    });
  }
});

// Add item to cart
router.post('/cart/add', requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid product ID' 
      });
    }

    if (quantity <= 0 || quantity > 10) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Quantity must be between 1 and 10' 
      });
    }

    // Verify product exists and is active
    const product = await Product.findById(productId);
    if (!product || !product.isActive) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Product not found or inactive' 
      });
    }

    // Check stock
    if (product.inventory !== null && product.inventory < quantity) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Insufficient stock' 
      });
    }

    const cart = await Cart.createOrUpdate(userId, productId, quantity);
    await cart.populate('items.productId', 'name description image pointsCost category inventory isActive');
    
    cart.totalPoints = await cart.getTotal();

    return res.json({
      status: 'success',
      message: 'Item added to cart',
      data: cart
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to add item to cart' 
    });
  }
});

// Update cart item quantity
router.patch('/cart/update', requireAuth, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.user._id;

    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid product ID' 
      });
    }

    if (quantity < 0 || quantity > 10) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Quantity must be between 0 and 10' 
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Cart not found' 
      });
    }

    await cart.updateItemQuantity(productId, quantity);
    await cart.populate('items.productId', 'name description image pointsCost category inventory isActive');
    
    cart.totalPoints = await cart.getTotal();

    return res.json({
      status: 'success',
      message: 'Cart updated',
      data: cart
    });
  } catch (error) {
    console.error('Update cart error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to update cart' 
    });
  }
});

// Remove item from cart
router.delete('/cart/remove/:productId', requireAuth, async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    if (!productId || !validateObjectId(productId)) {
      return res.status(400).json({ 
        status: 'error',
        message: 'Invalid product ID' 
      });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.status(404).json({ 
        status: 'error',
        message: 'Cart not found' 
      });
    }

    await cart.removeItem(productId);
    await cart.populate('items.productId', 'name description image pointsCost category inventory isActive');
    
    cart.totalPoints = await cart.getTotal();

    return res.json({
      status: 'success',
      message: 'Item removed from cart',
      data: cart
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to remove item from cart' 
    });
  }
});

// Clear cart
router.delete('/cart/clear', requireAuth, async (req, res) => {
  try {
    const userId = req.user._id;
    
    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({
        status: 'success',
        message: 'Cart already empty',
        data: { items: [], totalPoints: 0 }
      });
    }

    await cart.clearCart();
    
    return res.json({
      status: 'success',
      message: 'Cart cleared',
      data: { items: [], totalPoints: 0 }
    });
  } catch (error) {
    console.error('Clear cart error:', error);
    return res.status(500).json({ 
      status: 'error',
      message: 'Failed to clear cart' 
    });
  }
});

// Purchase a product
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;
    const userId = req.user._id;

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
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status;

    const query= { userId: req.user._id };
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
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit) || 10, 50);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    console.log('Order history request - search param:', search, 'type:', typeof search);
    console.log('All query params:', req.query);

    // Build query - ENSURE we filter by the current user only
    const query= { userId };
    if (status) {
      query.status = status;
    }

    // Build query - ENSURE we filter by the current user only
    const baseQuery = { userId };
    if (status) {
      baseQuery.status = status;
    }

    let orders;
    let total;
    
    if (search) {
      console.log('Search term:', search);
      console.log('User ID:', userId);
      
      // Use aggregation for search
      try {
        orders = await Order.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $lookup: {
              from: 'products',
              localField: 'items.productId',
              foreignField: '_id',
              as: 'productData'
            }
          },
          {
            $match: {
              ...(status && { status }),
              $or: [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'productData.name': { $regex: search, $options: 'i' } }
              ]
            }
          },
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit }
        ]);
        
        console.log('Search results:', orders.length);
        
        // Get count
        const countResult = await Order.aggregate([
          { $match: { userId: new mongoose.Types.ObjectId(userId) } },
          {
            $lookup: {
              from: 'products',
              localField: 'items.productId',
              foreignField: '_id',
              as: 'productData'
            }
          },
          {
            $match: {
              ...(status && { status }),
              $or: [
                { orderNumber: { $regex: search, $options: 'i' } },
                { 'productData.name': { $regex: search, $options: 'i' } }
              ]
            }
          },
          { $count: "total" }
        ]);
        total = countResult[0]?.total || 0;
        
        // Process aggregated results
        for (const order of orders) {
          if (order.items && order.productData) {
            order.items = order.items.map(item => {
              const productData = order.productData.find(p => p._id.toString() === item.productId.toString());
              return {
                ...item,
                productId: productData || item.productId
              };
            });
          }
          delete order.productData;
        }
        
      } catch (searchError) {
        console.error('Search aggregation error:', searchError);
        throw searchError;
      }
    } else {
      // Regular query without search
      orders = await Order.find(baseQuery)
        .populate('items.productId', 'name description image category rating')
        .populate('userId', 'name email department')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);
        
      total = await Order.countDocuments(baseQuery);
    }

    // Generate receipts for each order
    const ordersWithReceipts = orders.map(order => {
      const orderObj = order.toObject ? order.toObject() : order;
      const receipt = {
        receiptId: `RCP-${order._id}`,
        orderNumber: orderObj.orderNumber || `ORD-${order._id}`,
        orderId: order._id,
        timestamp: order.createdAt.toISOString(),
        items: order.items.map(item => {
          const product = item.productId;
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
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      userId: req.user._id,
      search: req.query.search
    });
    return res.status(500).json({
      status: 'error',
      message: 'Failed to fetch order history',
      error: error.message
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
    if (order.userId._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json(order);
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Get all products
router.get('/admin/products', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const search = req.query.search;
    const includeInactive = req.query.includeInactive === 'true';

    const query= {};
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
      status: 'success',
      data: products,
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
router.post('/admin/products', requireAuth, requireAdmin, async (req, res) => {
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

    // Validation
    if (!name || !description || !pointsCost || !category || !image || inventory === undefined) {
      return res.status(400).json({ 
        message: 'All required fields must be provided',
        required: ['name', 'description', 'pointsCost', 'category', 'image', 'inventory']
      });
    }

    if (typeof pointsCost !== 'number' || pointsCost < 1) {
      return res.status(400).json({ message: 'Points cost must be a positive number' });
    }

    if (typeof inventory !== 'number' || inventory < 0) {
      return res.status(400).json({ message: 'Inventory must be a non-negative number' });
    }

    const validCategories = ['apparel', 'accessories', 'electronics', 'office', 'giftcards', 'experiences', 'food', 'books'];
    if (!validCategories.includes(category.toLowerCase())) {
      return res.status(400).json({ 
        message: 'Invalid category',
        validCategories
      });
    }

    if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(image)) {
      return res.status(400).json({ 
        message: 'Image must be a valid URL ending with jpg, jpeg, png, gif, or webp' 
      });
    }

    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      pointsCost,
      category: category.toLowerCase(),
      image: image.trim(),
      inventory,
      isActive
    });

    await product.save();

    return res.status(201).json({
      status: 'success',
      message: 'Product created successfully',
      data: product
    });
  } catch (error) {
    console.error('Create product error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map((err) => err.message)
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Update product
router.patch('/admin/products/:productId', requireAuth, requireAdmin, async (req, res) => {
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

    // Validate updated fields
    if (name !== undefined && (typeof name !== 'string' || !name.trim())) {
      return res.status(400).json({ message: 'Product name must be a non-empty string' });
    }

    if (description !== undefined && (typeof description !== 'string' || !description.trim())) {
      return res.status(400).json({ message: 'Description must be a non-empty string' });
    }

    if (pointsCost !== undefined && (typeof pointsCost !== 'number' || pointsCost < 1)) {
      return res.status(400).json({ message: 'Points cost must be a positive number' });
    }

    if (inventory !== undefined && (typeof inventory !== 'number' || inventory < 0)) {
      return res.status(400).json({ message: 'Inventory must be a non-negative number' });
    }

    if (category !== undefined) {
      const validCategories = ['apparel', 'accessories', 'electronics', 'office', 'giftcards', 'experiences', 'food', 'books'];
      if (!validCategories.includes(category.toLowerCase())) {
        return res.status(400).json({ 
          message: 'Invalid category',
          validCategories
        });
      }
    }

    if (image !== undefined && !/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(image)) {
      return res.status(400).json({ 
        message: 'Image must be a valid URL ending with jpg, jpeg, png, gif, or webp' 
      });
    }

    // Update fields
    if (name !== undefined) product.name = name.trim();
    if (description !== undefined) product.description = description.trim();
    if (pointsCost !== undefined) product.pointsCost = pointsCost;
    if (category !== undefined) product.category = category.toLowerCase();
    if (image !== undefined) product.image = image.trim();
    if (inventory !== undefined) product.inventory = inventory;
    if (isActive !== undefined) product.isActive = isActive;

    await product.save();

    return res.json({
      status: 'success',
      message: 'Product updated successfully',
      data: product
    });
  } catch (error) {
    console.error('Update product error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        errors: Object.values(error.errors).map((err) => err.message)
      });
    }
    return res.status(500).json({ message: 'Server error' });
  }
});

// Admin routes - Delete product
router.delete('/admin/products/:productId', requireAuth, requireAdmin, async (req, res) => {
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
router.get('/admin/orders', requireAuth, requireAdmin, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const skip = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    const query= {};
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
        (order.userId).name.toLowerCase().includes(search.toLowerCase()) ||
        (order.userId).email.toLowerCase().includes(search.toLowerCase()) ||
        order.items.some((item) => 
          (item.productId).name.toLowerCase().includes(search.toLowerCase())
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
    const userId = req.user._id;
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
      const orderItems = [];
      const purchaseDetails = [];
      let grandTotal = 0;
      const productUpdates = [];

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
        status: 'pending',  // Changed from 'completed' to 'pending'
        shippingAddress,
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

      // Create comprehensive transaction record - SINGLE TRANSACTION PER ORDER
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

      // Save the single transaction
      await mainTransaction.save({ session });

      await session.commitTransaction();

      // Clear user's cart after successful purchase
      try {
        const userCart = await Cart.findOne({ userId });
        if (userCart) {
          await userCart.clearCart();
        }
      } catch (cartError) {
        console.warn('Failed to clear cart after purchase:', cartError);
        // Don't fail the purchase if cart clearing fails
      }

      // Generate detailed receipt
      const receipt = {
        receiptId: `RCP-${order._id}`,
        orderNumber,
        orderId: order._id,
        timestamp: new Date().toISOString(),
        customer: {
          name: req.user.name,
          email: req.user.email,
          userId: req.user._id
        },
        items: purchaseDetails,
        summary: {
          itemCount: orderItems.length,
          totalQuantity: orderItems.reduce((sum, item) => sum + item.quantity, 0),
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
        status: 'pending'  // Changed from 'completed' to 'pending'
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
          transactionId: mainTransaction._id
        }
      });

    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      await session.endSession();
    }

  } catch (error) {
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
    const userId = req.user._id;

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
    const userObj = orderObj.userId;
    
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
        const productObj = item.productId;
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

// Cancel order by user (only pending orders)
router.patch('/orders/:orderId/cancel', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user._id;

    if (!orderId || !validateObjectId(orderId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findOne({ _id: orderId, userId });

    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending orders can be cancelled'
      });
    }

    // Update order status
    order.status = 'cancelled';
    order.cancelledAt = new Date();
    await order.save();

    // Refund points to user
    const userPoints = await UserPoints.findOne({ userId });
    if (userPoints) {
      userPoints.availablePoints += order.totalPoints;
      userPoints.totalSpent -= order.totalPoints;
      await userPoints.save();

      // Create refund transaction
      const transaction = new Transaction({
        toUserId: userId,
        type: 'refund',
        amount: order.totalPoints,
        description: `Refund for cancelled order ${order.orderNumber || order._id}`,
        metadata: {
          orderId: order._id,
          refundReason: 'Order cancelled by user'
        }
      });

      await transaction.save();
    }

    // Restore product inventory
    for (const item of order.items) {
      const product = await Product.findById(item.productId);
      if (product && product.inventory !== null) {
        product.inventory += item.quantity;
        await product.save();
      }
    }

    const updatedOrder = await Order.findById(orderId)
      .populate('items.productId', 'name description image category')
      .populate('userId', 'name email department');

    return res.json({
      status: 'success',
      message: 'Order cancelled successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to cancel order'
    });
  }
});

// Request cancellation for completed orders
router.patch('/orders/:orderId/request-cancellation', requireAuth, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason = '' } = req.body;
    const userId = req.user._id;

    if (!orderId || !validateObjectId(orderId)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid order ID'
      });
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        status: 'error',
        message: 'Order not found'
      });
    }

    // Check if user owns the order
    if (order.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        status: 'error',
        message: 'Unauthorized to request cancellation for this order'
      });
    }

    // Check if order is in a state that allows cancellation requests
    if (!['completed', 'pending'].includes(order.status)) {
      return res.status(400).json({
        status: 'error',
        message: 'Only pending or completed orders can request cancellation'
      });
    }

    // Check if cancellation request already exists
    if (order.cancellationRequest.requested) {
      return res.status(400).json({
        status: 'error',
        message: 'Cancellation request already submitted for this order'
      });
    }

    // Update order with cancellation request
    order.cancellationRequest = {
      requested: true,
      requestedAt: new Date(),
      requestedBy: userId,
      reason: reason.trim(),
      adminResponse: 'pending',
      adminNotes: '',
      processedAt: null,
      processedBy: null
    };

    await order.save();

    const updatedOrder = await Order.findById(orderId)
      .populate('items.productId', 'name description image category')
      .populate('userId', 'name email department');

    return res.json({
      status: 'success',
      message: 'Cancellation request submitted successfully',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Request cancellation error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to submit cancellation request'
    });
  }
});

export default router;
