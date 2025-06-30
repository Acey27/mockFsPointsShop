import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db/connection.js';
import { products, orders, orderItems, userPoints, transactions } from '../db/schema.js';
import { eq, and, like, sql, or } from 'drizzle-orm';
import { authenticateToken, AuthRequest } from '../middleware/auth.js';

const router = Router();

// Validation schemas
const orderSchema = z.object({
  items: z.array(z.object({
    productId: z.number().int().positive(),
    quantity: z.number().int().positive(),
  })).min(1, 'Order must contain at least one item'),
  shippingAddress: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zipCode: z.string(),
    country: z.string().default('US'),
  }).optional(),
  notes: z.string().max(500).optional(),
});

// Get all products with filtering
router.get('/products', async (req, res) => {
  try {
    const category = req.query['category'] as string;
    const search = req.query['search'] as string;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = Math.min(parseInt(req.query['limit'] as string) || 20, 100);
    const offset = (page - 1) * limit;

    let whereClause = eq(products.isActive, true);

    // Apply filters
    if (category && category !== 'all') {
      whereClause = and(whereClause, eq(products.category, category))!;
    }

    if (search) {
      whereClause = and(
        whereClause,
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`)
        )!
      )!;
    }

    const productList = await db
      .select()
      .from(products)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    return res.json({
      products: productList,
      page,
      limit,
      hasMore: productList.length === limit,
    });
  } catch (error) {
    console.error('Get products error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single product by ID
router.get('/products/:id', async (req, res) => {
  try {
    const productId = parseInt(req.params.id);

    if (isNaN(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    const product = await db
      .select()
      .from(products)
      .where(and(eq(products.id, productId), eq(products.isActive, true)))
      .limit(1);

    if (product.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json(product[0]);
  } catch (error) {
    console.error('Get product error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Place an order
router.post('/orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const validatedData = orderSchema.parse(req.body);

    // Get user's current points
    const userPointsData = await db
      .select()
      .from(userPoints)
      .where(eq(userPoints.userId, userId))
      .limit(1);

    if (userPointsData.length === 0) {
      return res.status(404).json({ error: 'User points data not found' });
    }

    const currentPoints = userPointsData[0];

    // Validate products and calculate total
    let totalPoints = 0;
    const orderProducts: Array<{
      product: any;
      quantity: number;
      totalPoints: number;
    }> = [];

    for (const item of validatedData.items) {
      const product = await db
        .select()
        .from(products)
        .where(and(eq(products.id, item.productId), eq(products.isActive, true)))
        .limit(1);

      if (product.length === 0) {
        return res.status(400).json({ error: `Product with ID ${item.productId} not found` });
      }

      const productData = product[0];

      if (productData.inventory < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient inventory for ${productData.name}. Available: ${productData.inventory}, Requested: ${item.quantity}` 
        });
      }

      const itemTotal = productData.pointsCost * item.quantity;
      totalPoints += itemTotal;

      orderProducts.push({
        product: productData,
        quantity: item.quantity,
        totalPoints: itemTotal,
      });
    }

    // Check if user has enough points
    if (totalPoints > currentPoints.availablePoints) {
      return res.status(400).json({ 
        error: `Insufficient points. Required: ${totalPoints}, Available: ${currentPoints.availablePoints}` 
      });
    }

    // Create order in transaction
    const result = await db.transaction(async (tx) => {
      // Create order
      const newOrder = await tx
        .insert(orders)
        .values({
          userId,
          totalPoints,
          shippingAddress: validatedData.shippingAddress || null,
          notes: validatedData.notes || null,
          status: 'completed',
        })
        .returning();

      const orderId = newOrder[0].id;

      // Create order items and update inventory
      for (const orderProduct of orderProducts) {
        await tx.insert(orderItems).values({
          orderId,
          productId: orderProduct.product.id,
          quantity: orderProduct.quantity,
          pointsCostPerItem: orderProduct.product.pointsCost,
          totalPoints: orderProduct.totalPoints,
        });

        // Update product inventory
        await tx
          .update(products)
          .set({
            inventory: orderProduct.product.inventory - orderProduct.quantity,
            updatedAt: new Date(),
          })
          .where(eq(products.id, orderProduct.product.id));
      }

      // Update user points
      await tx
        .update(userPoints)
        .set({
          availablePoints: currentPoints.availablePoints - totalPoints,
          totalSpent: currentPoints.totalSpent + totalPoints,
          updatedAt: new Date(),
        })
        .where(eq(userPoints.userId, userId));

      // Create transaction record
      await tx.insert(transactions).values({
        toUserId: userId,
        type: 'spent',
        amount: -totalPoints,
        description: `Order #${orderId} - ${orderProducts.length} item(s)`,
        metadata: { orderId, items: orderProducts.length },
      });

      return newOrder[0];
    });

    return res.json({
      message: 'Order placed successfully',
      order: result,
      totalPoints,
      itemCount: orderProducts.length,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('Create order error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's orders
router.get('/orders', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query['page'] as string) || 1;
    const limit = parseInt(req.query['limit'] as string) || 10;
    const offset = (page - 1) * limit;

    const userOrders = await db
      .select({
        id: orders.id,
        totalPoints: orders.totalPoints,
        status: orders.status,
        notes: orders.notes,
        createdAt: orders.createdAt,
        itemCount: sql<number>`(
          SELECT COUNT(*) 
          FROM ${orderItems} 
          WHERE ${orderItems.orderId} = ${orders.id}
        )`.as('itemCount'),
      })
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(sql`${orders.createdAt} DESC`)
      .limit(limit)
      .offset(offset);

    return res.json({
      orders: userOrders,
      page,
      limit,
    });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Get order details
router.get('/orders/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const orderId = parseInt(req.params['id']);

    if (isNaN(orderId)) {
      return res.status(400).json({ error: 'Invalid order ID' });
    }

    // Get order with items
    const order = await db
      .select()
      .from(orders)
      .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
      .limit(1);

    if (order.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const items = await db
      .select({
        id: orderItems.id,
        quantity: orderItems.quantity,
        pointsCostPerItem: orderItems.pointsCostPerItem,
        totalPoints: orderItems.totalPoints,
        product: {
          id: products.id,
          name: products.name,
          description: products.description,
          image: products.image,
          category: products.category,
        },
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, orderId));

    return res.json({
      order: order[0],
      items,
    });
  } catch (error) {
    console.error('Get order details error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
