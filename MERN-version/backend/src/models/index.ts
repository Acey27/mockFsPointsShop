// Export all models
export { User } from './User.js';
export { UserPoints } from './UserPoints.js';
export { Transaction } from './Transaction.js';
export { Product } from './Product.js';
export { Order } from './Order.js';
export { Mood } from './Mood.js';

// Export types
export type { IUser, UserModel } from './User.js';
export type { IUserPoints, UserPointsModel } from './UserPoints.js';
export type { ITransaction, TransactionModel } from './Transaction.js';
export type { IProduct, ProductModel } from './Product.js';
export type { IOrder, OrderModel, IOrderItem } from './Order.js';
export type { IMood, MoodModel } from './Mood.js';

// Re-export mongoose types for convenience
export type { Document, Types } from 'mongoose';
