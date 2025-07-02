# Points Shop MERN Application

A full-stack points-based employee recognition and rewards system built with the MERN stack (MongoDB, Express.js, React, Node.js).

## ✅ Quick Start Status

**🎉 APPLICATION IS FULLY FUNCTIONAL AND PRODUCTION-READY! 🎉**

✅ **Complete MERN Stack Implementation**
✅ **All Frontend Pages Implemented**: Login, Dashboard, Points, Shop, Mood, Admin
✅ **Full Backend API**: Authentication, Points, Shop, Mood tracking, Admin features
✅ **MongoDB Database**: Connected to Atlas with proper schema and sample data
✅ **Type Safety**: Full TypeScript implementation across the stack
✅ **Modern UI**: Responsive design with Tailwind CSS and Heroicons
✅ **Production Build**: Both frontend and backend build successfully
✅ **Demo Data**: Sample users, products, transactions, and mood entries loaded

**🔑 Demo Login Credentials:**
- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123
- **Test Users**: john.doe@example.com, jane.smith@example.com, mike.johnson@example.com / password123

**🌐 Access URLs:**
- Frontend: http://localhost:5175 (currently running)
- Backend API: http://localhost:3001 (currently running)
- Health Check: http://localhost:3001/health

## 🌟 Features

- **User Authentication & Authorization** - JWT-based secure login/registration
- **Points System** - Earn, spend, and track points
- **Peer Recognition** - Cheer colleagues and give points
- **Rewards Shop** - Redeem points for company merchandise and gift cards
- **Mood Tracking** - Daily mood check-ins and analytics
- **Admin Dashboard** - Manage users, products, and system settings
- **Real-time Notifications** - Instant updates for point transactions
- **Mobile Responsive** - Works seamlessly on all devices

## 🏗️ Architecture

```
MERN-version/
├── frontend/                 # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── contexts/       # React contexts (Auth, etc.)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # API client and utilities
│   │   ├── types/          # TypeScript type definitions
│   │   └── styles/         # Global styles and Tailwind config
│   └── package.json
├── backend/                  # Express + MongoDB + TypeScript
│   ├── src/
│   │   ├── models/         # Mongoose models
│   │   ├── routes/         # API route handlers
│   │   ├── middleware/     # Custom middleware
│   │   ├── services/       # Business logic
│   │   ├── utils/          # Helper functions
│   │   ├── config/         # Configuration files
│   │   └── server.ts       # Express server entry point
│   └── package.json
├── docker-compose.yml        # MongoDB and Mongo Express containers
├── package.json             # Root package with scripts
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for MongoDB)
- Git

### 1. Clone and Install

```bash
cd MERN-version
npm install
```

### 2. Start MongoDB

```bash
# Start MongoDB and Mongo Express with Docker
docker-compose up -d

# MongoDB will be available at: mongodb://localhost:27017
# Mongo Express (web UI) at: http://localhost:8081
```

### 3. Environment Setup

```bash
# Backend environment
cp backend/.env.example backend/.env
# Edit backend/.env with your configuration

# Frontend environment
cp frontend/.env.example frontend/.env
# Edit frontend/.env with your configuration
```

### 4. Development Mode

```bash
# Start both frontend and backend in development mode
npm run dev

# Or start them individually:
npm run dev:frontend    # Frontend on http://localhost:5173
npm run dev:backend     # Backend on http://localhost:3001
```

### 5. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Mongo Express**: http://localhost:8081
- **API Documentation**: http://localhost:3001/api-docs

## 📊 Database Schema

### Users Collection
```javascript
{
  _id: ObjectId,
  email: String (unique),
  password: String (hashed),
  name: String,
  department: String,
  avatar: String,
  role: "user" | "admin",
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### UserPoints Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  availablePoints: Number,
  totalEarned: Number,
  totalSpent: Number,
  monthlyCheerLimit: Number,
  monthlyCheerUsed: Number,
  lastMonthlyReset: Date,
  updatedAt: Date
}
```

### Transactions Collection
```javascript
{
  _id: ObjectId,
  fromUserId: ObjectId (ref: Users),
  toUserId: ObjectId (ref: Users),
  type: "earned" | "spent" | "given" | "received",
  amount: Number,
  description: String,
  message: String,
  metadata: Object,
  createdAt: Date
}
```

### Products Collection
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  image: String,
  pointsCost: Number,
  category: String,
  inventory: Number,
  rating: Number,
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Orders Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  items: [OrderItem],
  totalPoints: Number,
  status: "pending" | "completed" | "cancelled",
  shippingAddress: Object,
  notes: String,
  createdAt: Date,
  updatedAt: Date
}
```

### Moods Collection
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: Users),
  mood: "excellent" | "good" | "okay" | "not-great" | "poor",
  comment: String,
  date: Date,
  createdAt: Date
}
```

## 🛠️ Available Scripts

### Root Level
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend
- `npm run build` - Build both frontend and backend for production
- `npm run build:frontend` - Build only the frontend
- `npm run build:backend` - Build only the backend
- `npm run test` - Run tests for both frontend and backend
- `npm run seed` - Seed the database with sample data
- `npm run clean` - Clean build artifacts

### Frontend (React + Vite)
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript checks

### Backend (Express + MongoDB)
- `npm run dev` - Start development server with hot reload
- `npm run build` - Compile TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run seed` - Populate database with sample data
- `npm run test` - Run API tests

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/profile` - Update user profile

### Users
- `GET /api/users` - Get all users (paginated)
- `GET /api/users/search` - Search users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Points & Transactions
- `GET /api/points/balance` - Get user's point balance
- `GET /api/points/transactions` - Get user's transactions
- `POST /api/points/cheer` - Give points to another user
- `GET /api/points/leaderboard` - Get points leaderboard

### Shop & Products
- `GET /api/shop/products` - Get all products (with filters)
- `GET /api/shop/products/:id` - Get product by ID
- `POST /api/shop/cart/add` - Add item to cart
- `GET /api/shop/cart` - Get user's cart
- `POST /api/shop/checkout` - Process order
- `GET /api/shop/orders` - Get user's orders

### Mood Tracking
- `POST /api/mood` - Submit daily mood
- `GET /api/mood/history` - Get mood history
- `GET /api/mood/analytics` - Get mood analytics

### Admin
- `GET /api/admin/dashboard` - Admin dashboard data
- `POST /api/admin/products` - Create product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product
- `GET /api/admin/users` - Get all users with admin view
- `GET /api/admin/analytics` - Get system analytics

---

**Happy coding! 🎉**
