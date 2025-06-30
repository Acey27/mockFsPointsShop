import Joi from 'joi';
import mongoose from 'mongoose';

// Helper function to validate MongoDB ObjectId
export const validateObjectId = (id: string): boolean => {
  return mongoose.Types.ObjectId.isValid(id);
};

// User validation schemas
export const userRegistrationSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .min(6)
    .max(128)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      'string.min': 'Password must be at least 6 characters long',
      'string.max': 'Password cannot exceed 128 characters',
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      'any.required': 'Password is required'
    }),
  
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters',
      'any.required': 'Name is required'
    }),
  
  department: Joi.string()
    .min(2)
    .max(50)
    .required()
    .trim()
    .messages({
      'string.min': 'Department must be at least 2 characters long',
      'string.max': 'Department cannot exceed 50 characters',
      'any.required': 'Department is required'
    }),
  
  avatar: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Avatar must be a valid URL'
    })
});

export const userLoginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .lowercase()
    .trim()
    .messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Email is required'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

export const userUpdateSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name cannot exceed 100 characters'
    }),
  
  department: Joi.string()
    .min(2)
    .max(50)
    .optional()
    .trim()
    .messages({
      'string.min': 'Department must be at least 2 characters long',
      'string.max': 'Department cannot exceed 50 characters'
    }),
  
  avatar: Joi.string()
    .uri()
    .optional()
    .allow('')
    .messages({
      'string.uri': 'Avatar must be a valid URL'
    })
});

// Points and transaction validation schemas
export const cheerSchema = Joi.object({
  toUserId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid user ID format',
      'any.required': 'Recipient user ID is required'
    }),
  
  amount: Joi.number()
    .integer()
    .min(1)
    .max(50)
    .required()
    .messages({
      'number.base': 'Amount must be a number',
      'number.integer': 'Amount must be a whole number',
      'number.min': 'Amount must be at least 1 point',
      'number.max': 'Amount cannot exceed 50 points',
      'any.required': 'Amount is required'
    }),
  
  message: Joi.string()
    .max(500)
    .optional()
    .trim()
    .allow('')
    .messages({
      'string.max': 'Message cannot exceed 500 characters'
    })
});

// Product validation schemas
export const productSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .trim()
    .messages({
      'string.min': 'Product name must be at least 2 characters long',
      'string.max': 'Product name cannot exceed 100 characters',
      'any.required': 'Product name is required'
    }),
  
  description: Joi.string()
    .min(10)
    .max(1000)
    .required()
    .trim()
    .messages({
      'string.min': 'Description must be at least 10 characters long',
      'string.max': 'Description cannot exceed 1000 characters',
      'any.required': 'Description is required'
    }),
  
  image: Joi.string()
    .uri()
    .required()
    .pattern(/\.(jpg|jpeg|png|gif|webp)$/i)
    .messages({
      'string.uri': 'Image must be a valid URL',
      'string.pattern.base': 'Image URL must end with .jpg, .jpeg, .png, .gif, or .webp',
      'any.required': 'Image URL is required'
    }),
  
  pointsCost: Joi.number()
    .integer()
    .min(1)
    .max(10000)
    .required()
    .messages({
      'number.base': 'Points cost must be a number',
      'number.integer': 'Points cost must be a whole number',
      'number.min': 'Points cost must be at least 1',
      'number.max': 'Points cost cannot exceed 10,000',
      'any.required': 'Points cost is required'
    }),
  
  category: Joi.string()
    .valid('apparel', 'accessories', 'electronics', 'office', 'giftcards', 'experiences', 'food', 'books')
    .required()
    .messages({
      'any.only': 'Category must be one of: apparel, accessories, electronics, office, giftcards, experiences, food, books',
      'any.required': 'Category is required'
    }),
  
  inventory: Joi.number()
    .integer()
    .min(0)
    .max(10000)
    .required()
    .messages({
      'number.base': 'Inventory must be a number',
      'number.integer': 'Inventory must be a whole number',
      'number.min': 'Inventory cannot be negative',
      'number.max': 'Inventory cannot exceed 10,000',
      'any.required': 'Inventory is required'
    }),
  
  rating: Joi.number()
    .min(0)
    .max(5)
    .optional()
    .default(0)
    .messages({
      'number.base': 'Rating must be a number',
      'number.min': 'Rating cannot be less than 0',
      'number.max': 'Rating cannot be more than 5'
    }),
  
  isActive: Joi.boolean()
    .optional()
    .default(true)
});

// Order validation schemas
export const cartItemSchema = Joi.object({
  productId: Joi.string()
    .required()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .messages({
      'string.pattern.base': 'Invalid product ID format',
      'any.required': 'Product ID is required'
    }),
  
  quantity: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .required()
    .messages({
      'number.base': 'Quantity must be a number',
      'number.integer': 'Quantity must be a whole number',
      'number.min': 'Quantity must be at least 1',
      'number.max': 'Quantity cannot exceed 100',
      'any.required': 'Quantity is required'
    })
});

export const checkoutSchema = Joi.object({
  items: Joi.array()
    .items(cartItemSchema)
    .min(1)
    .max(20)
    .required()
    .messages({
      'array.min': 'Order must contain at least 1 item',
      'array.max': 'Order cannot contain more than 20 items',
      'any.required': 'Items are required'
    }),
  
  shippingAddress: Joi.object({
    name: Joi.string().min(2).max(100).required().trim(),
    email: Joi.string().email({ tlds: { allow: false } }).required().lowercase().trim(),
    address: Joi.string().min(5).max(200).required().trim(),
    city: Joi.string().min(2).max(50).required().trim(),
    state: Joi.string().min(2).max(50).required().trim(),
    zipCode: Joi.string().min(3).max(20).required().trim(),
    country: Joi.string().min(2).max(50).optional().default('United States').trim()
  }).optional(),
  
  notes: Joi.string()
    .max(1000)
    .optional()
    .trim()
    .allow('')
    .messages({
      'string.max': 'Notes cannot exceed 1000 characters'
    })
});

// Mood validation schema
export const moodSchema = Joi.object({
  mood: Joi.string()
    .valid('excellent', 'good', 'okay', 'not-great', 'poor')
    .required()
    .messages({
      'any.only': 'Mood must be one of: excellent, good, okay, not-great, poor',
      'any.required': 'Mood is required'
    }),
  
  comment: Joi.string()
    .max(500)
    .optional()
    .trim()
    .allow('')
    .messages({
      'string.max': 'Comment cannot exceed 500 characters'
    }),
  
  date: Joi.date()
    .max('now')
    .optional()
    .messages({
      'date.max': 'Date cannot be in the future'
    })
});

// Query parameter validation schemas
export const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .optional()
    .default(1)
    .messages({
      'number.base': 'Page must be a number',
      'number.integer': 'Page must be a whole number',
      'number.min': 'Page must be at least 1'
    }),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .optional()
    .default(20)
    .messages({
      'number.base': 'Limit must be a number',
      'number.integer': 'Limit must be a whole number',
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit cannot exceed 100'
    })
});

export const productFilterSchema = Joi.object({
  category: Joi.string()
    .valid('all', 'apparel', 'accessories', 'electronics', 'office', 'giftcards', 'experiences', 'food', 'books')
    .optional()
    .default('all'),
  
  minPoints: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Minimum points must be a number',
      'number.integer': 'Minimum points must be a whole number',
      'number.min': 'Minimum points cannot be negative'
    }),
  
  maxPoints: Joi.number()
    .integer()
    .min(0)
    .optional()
    .messages({
      'number.base': 'Maximum points must be a number',
      'number.integer': 'Maximum points must be a whole number',
      'number.min': 'Maximum points cannot be negative'
    }),
  
  search: Joi.string()
    .max(100)
    .optional()
    .trim()
    .messages({
      'string.max': 'Search term cannot exceed 100 characters'
    }),
  
  sortBy: Joi.string()
    .valid('name', 'pointsCost', 'rating', 'createdAt')
    .optional()
    .default('createdAt'),
  
  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .optional()
    .default('desc')
}).and('page', 'limit');

// MongoDB ObjectId validation
export const objectIdSchema = Joi.object({
  id: Joi.string()
    .pattern(/^[0-9a-fA-F]{24}$/)
    .required()
    .messages({
      'string.pattern.base': 'Invalid ID format',
      'any.required': 'ID is required'
    })
});
