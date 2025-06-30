import { pgTable, serial, varchar, integer, timestamp, text, boolean, decimal, jsonb, unique, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users table
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  department: varchar('department', { length: 100 }).notNull(),
  avatar: text('avatar'),
  role: varchar('role', { length: 20 }).notNull().default('user'), // 'user', 'admin'
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  departmentIdx: index('users_department_idx').on(table.department),
}));

// Points table - tracks user point balances
export const userPoints = pgTable('user_points', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  availablePoints: integer('available_points').notNull().default(0),
  totalEarned: integer('total_earned').notNull().default(0),
  totalSpent: integer('total_spent').notNull().default(0),
  monthlyCheerLimit: integer('monthly_cheer_limit').notNull().default(100),
  monthlyCheerUsed: integer('monthly_cheer_used').notNull().default(0),
  lastMonthlyReset: timestamp('last_monthly_reset').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: unique('user_points_user_id_unique').on(table.userId),
}));

// Transactions table - records all point movements
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  fromUserId: integer('from_user_id').references(() => users.id, { onDelete: 'set null' }),
  toUserId: integer('to_user_id').references(() => users.id, { onDelete: 'set null' }),
  type: varchar('type', { length: 20 }).notNull(), // 'earned', 'spent', 'given', 'received'
  amount: integer('amount').notNull(),
  description: text('description').notNull(),
  message: text('message'),
  metadata: jsonb('metadata'), // Additional data like product info, etc.
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  fromUserIdx: index('transactions_from_user_idx').on(table.fromUserId),
  toUserIdx: index('transactions_to_user_idx').on(table.toUserId),
  typeIdx: index('transactions_type_idx').on(table.type),
  createdAtIdx: index('transactions_created_at_idx').on(table.createdAt),
}));

// Products table
export const products = pgTable('products', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description').notNull(),
  image: text('image').notNull(),
  pointsCost: integer('points_cost').notNull(),
  category: varchar('category', { length: 50 }).notNull(),
  inventory: integer('inventory').notNull().default(0),
  rating: decimal('rating', { precision: 2, scale: 1 }).notNull().default('0.0'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  categoryIdx: index('products_category_idx').on(table.category),
  activeIdx: index('products_active_idx').on(table.isActive),
  costIdx: index('products_cost_idx').on(table.pointsCost),
}));

// Orders table
export const orders = pgTable('orders', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalPoints: integer('total_points').notNull(),
  status: varchar('status', { length: 20 }).notNull().default('pending'), // 'pending', 'completed', 'cancelled'
  shippingAddress: jsonb('shipping_address'),
  notes: text('notes'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('orders_user_id_idx').on(table.userId),
  statusIdx: index('orders_status_idx').on(table.status),
  createdAtIdx: index('orders_created_at_idx').on(table.createdAt),
}));

// Order items table
export const orderItems = pgTable('order_items', {
  id: serial('id').primaryKey(),
  orderId: integer('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  quantity: integer('quantity').notNull(),
  pointsCostPerItem: integer('points_cost_per_item').notNull(),
  totalPoints: integer('total_points').notNull(),
}, (table) => ({
  orderIdIdx: index('order_items_order_id_idx').on(table.orderId),
  productIdIdx: index('order_items_product_id_idx').on(table.productId),
}));

// Mood entries table
export const moodEntries = pgTable('mood_entries', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  mood: varchar('mood', { length: 20 }).notNull(), // 'excellent', 'good', 'okay', 'not-great', 'poor'
  comment: text('comment'),
  date: timestamp('date').notNull().defaultNow(),
}, (table) => ({
  userIdIdx: index('mood_entries_user_id_idx').on(table.userId),
  dateIdx: index('mood_entries_date_idx').on(table.date),
  moodIdx: index('mood_entries_mood_idx').on(table.mood),
}));

// Product reviews table
export const productReviews = pgTable('product_reviews', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  productId: integer('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
  rating: integer('rating').notNull(), // 1-5
  comment: text('comment'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
}, (table) => ({
  userProductIdx: unique('product_reviews_user_product_unique').on(table.userId, table.productId),
  productIdIdx: index('product_reviews_product_id_idx').on(table.productId),
  ratingIdx: index('product_reviews_rating_idx').on(table.rating),
}));

// Define relationships
export const usersRelations = relations(users, ({ one, many }) => ({
  points: one(userPoints, {
    fields: [users.id],
    references: [userPoints.userId],
  }),
  sentTransactions: many(transactions, { relationName: 'sentTransactions' }),
  receivedTransactions: many(transactions, { relationName: 'receivedTransactions' }),
  orders: many(orders),
  moodEntries: many(moodEntries),
  productReviews: many(productReviews),
}));

export const userPointsRelations = relations(userPoints, ({ one }) => ({
  user: one(users, {
    fields: [userPoints.userId],
    references: [users.id],
  }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  fromUser: one(users, {
    fields: [transactions.fromUserId],
    references: [users.id],
    relationName: 'sentTransactions',
  }),
  toUser: one(users, {
    fields: [transactions.toUserId],
    references: [users.id],
    relationName: 'receivedTransactions',
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const productsRelations = relations(products, ({ many }) => ({
  orderItems: many(orderItems),
  reviews: many(productReviews),
}));

export const moodEntriesRelations = relations(moodEntries, ({ one }) => ({
  user: one(users, {
    fields: [moodEntries.userId],
    references: [users.id],
  }),
}));

export const productReviewsRelations = relations(productReviews, ({ one }) => ({
  user: one(users, {
    fields: [productReviews.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [productReviews.productId],
    references: [products.id],
  }),
}));
