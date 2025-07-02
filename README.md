# 🏆 Points Shop - MERN Stack Application

A complete employee recognition and rewards system built with the **MERN Stack** (MongoDB, Express.js, React, Node.js) and TypeScript.

![MERN Stack](https://img.shields.io/badge/MERN-Stack-brightgreen)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=flat&logo=mongodb&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)

## 🚀 Quick Start

Get the application running on your machine in just a few commands:

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/mockfs-points-shop.git
cd mockfs-points-shop

# 2. Navigate to the main application
cd MERN-version

# 3. Install all dependencies (frontend + backend)
npm run install:all

# 4. Start MongoDB with Docker
npm run docker:up

# 5. Set up the database with sample data
npm run setup

# 6. Start the development servers
npm run dev
```

🎉 **That's it!** The application will be available at:
- **Frontend**: http://localhost:5175
- **Backend API**: http://localhost:3001
- **Database Admin**: http://localhost:8081 (Mongo Express)

> **🔒 Security Note**: This project uses local MongoDB with Docker for development. Each user gets their own isolated database instance. Your data is completely secure and separate from other users.

## ✨ Features

### 🎯 Core Features
- **🔐 User Authentication** - Secure JWT-based login/register system
- **🎁 Point System** - Earn and spend points for peer recognition
- **👥 Peer Recognition** - Give points and cheer messages to colleagues
- **🛍️ Rewards Shop** - Redeem points for company swag and gift cards
- **😊 Mood Tracking** - Daily mood check-ins with analytics and insights
- **📊 Transaction History** - Complete audit trail of all point activities
- **👤 User Profiles** - Manage personal information and avatars
- **⚡ Admin Dashboard** - Admin tools for managing users and products

### 🔧 Technical Features
- **📱 Responsive Design** - Works seamlessly on desktop and mobile
- **🔒 Security** - JWT authentication, password hashing, rate limiting
- **⚡ Real-time Updates** - Live updates for points and transactions
- **📝 Type Safety** - Full TypeScript implementation across the stack
- **🎨 Modern UI** - Beautiful interface with Tailwind CSS
- **🧪 Error Handling** - Comprehensive error handling and validation

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Query** for data fetching and caching
- **React Router** for navigation
- **React Hook Form** with validation
- **Heroicons** for beautiful icons

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation
- **CORS** and **Helmet** for security

### Database & DevOps
- **MongoDB** as the primary database
- **Docker & Docker Compose** for easy setup
- **Mongo Express** for database administration
- **Concurrently** for running multiple servers

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your machine:

- **Node.js** (version 18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Docker** and **Docker Compose** - [Download here](https://docs.docker.com/get-docker/)
- **Git** - [Download here](https://git-scm.com/downloads)

## 🏗️ Installation & Setup

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/mockfs-points-shop.git
cd mockfs-points-shop/MERN-version
```

### 2. Install Dependencies
```bash
# Install all frontend and backend dependencies
npm run install:all
```

### 3. Environment Setup
```bash
# Copy example environment file for backend
cp backend/.env.example backend/.env
```
The default `.env` works with Docker—no changes required!

### 4. Start MongoDB Database
```bash
# Start MongoDB and Mongo Express using Docker
npm run docker:up

# (Optional) To stop the database:
# npm run docker:down
```

### 5. Initialize Database with Sample Data
```bash
# Set up schema and seed database with sample data
npm run setup
```

### 6. Start the Application
```bash
# Start both frontend and backend servers
npm run dev
```

## 🎮 Demo Accounts

The application comes with pre-loaded demo accounts:

| Email | Password | Role | Department |
|-------|----------|------|------------|
| admin@example.com | admin123 | Admin | IT |
| john.doe@example.com | password123 | User | Engineering |
| jane.smith@example.com | password123 | User | Design |
| mike.johnson@example.com | password123 | User | Marketing |

## 🌐 Access URLs

Once running, you can access:

- **🎨 Frontend Application**: http://localhost:5175
- **🔌 Backend API**: http://localhost:3001
- **📊 Database Admin (Mongo Express)**: http://localhost:8081
- **❤️ Health Check**: http://localhost:3001/health

## 📱 Application Structure

```
MERN-version/
├── 📁 frontend/              # React TypeScript application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   ├── pages/           # Application pages
│   │   ├── contexts/        # React contexts (Auth, etc.)
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # API client and utilities
│   │   └── types/           # TypeScript definitions
│   └── package.json
├── 📁 backend/              # Express.js TypeScript API
│   ├── src/
│   │   ├── models/          # Mongoose models
│   │   ├── routes/          # API route handlers
│   │   ├── middleware/      # Authentication & validation
│   │   ├── services/        # Business logic
│   │   └── utils/           # Helper functions
│   └── package.json
├── docker-compose.yml       # MongoDB setup
└── package.json            # Root package with scripts
```

## 🔌 API Endpoints

### 🔐 Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### 🎁 Points System
- `GET /api/points/balance` - Get user point balance
- `GET /api/points/transactions` - Get transaction history
- `POST /api/points/cheer` - Send points to peer
- `GET /api/points/leaderboard` - Get top point earners

### 🛍️ Shop
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `POST /api/orders` - Place order
- `GET /api/orders` - Get user order history

### 👥 Users
- `GET /api/users` - Get users list (for peer selection)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### 😊 Mood Tracking
- `POST /api/mood` - Log daily mood
- `GET /api/mood/history` - Get mood history
- `GET /api/mood/insights` - Get mood analytics

## 🛠️ Development Commands

### Root Commands (from MERN-version/)
```bash
npm run dev              # Start both frontend and backend
npm run build            # Build both applications
npm run start            # Start production server
npm run test             # Run all tests
npm run docker:up        # Start MongoDB with Docker
npm run docker:down      # Stop MongoDB
npm run install:all      # Install all dependencies
npm run setup            # Set up database with sample data
```

### Frontend Commands (from frontend/)
```bash
npm run dev              # Start development server (Vite)
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run type-check       # Check TypeScript types
```

### Backend Commands (from backend/)
```bash
npm run dev              # Start development server with hot reload
npm run build            # Compile TypeScript to JavaScript
npm run start            # Start production server
npm run test             # Run Jest tests
npm run db:setup         # Set up database schema and seed data
npm run db:seed          # Seed database with sample data only
npm run lint             # Run ESLint
```

## 🚀 Production Deployment

### Environment Variables

Create production environment files:

**Backend (.env)**:
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/points-shop
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env.production)**:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Build and Deploy
```bash
# Build for production
npm run build

# Start production server
npm run start
```

## 🗄️ Database Schema

The application uses MongoDB with the following collections:

- **users** - User accounts, profiles, and authentication
- **products** - Rewards shop inventory and product details
- **orders** - Purchase history and order tracking
- **transactions** - Point movements, transfers, and history
- **mood_entries** - Daily mood tracking data
- **notifications** - System notifications and alerts

## 🔒 Security Features

- **🔐 JWT Authentication** with secure token storage
- **🔒 Password Hashing** using bcrypt with salt rounds
- **🚫 Rate Limiting** to prevent API abuse
- **✅ Input Validation** using express-validator
- **🛡️ CORS Protection** with configurable origins
- **🔰 Security Headers** using Helmet.js
- **🚨 Error Handling** with proper error responses

### 🏠 Database Privacy & Security

**Your database is completely private and secure:**

✅ **Local Development Only**: MongoDB runs in Docker on your machine  
✅ **No External Access**: Database is only accessible from `localhost`  
✅ **Isolated Instances**: Each user gets their own separate database  
✅ **No Data Sharing**: Other users cannot access your data  
✅ **Safe Credentials**: Demo credentials are for local development only  

**How it works:**
- When you run `npm run docker:up`, Docker creates a MongoDB container on YOUR computer
- The database is bound to `localhost:27017` - only your machine can access it
- Each person who clones the project gets their own fresh, empty database
- No network connection exists between different users' databases

**For Production**: Use secure cloud databases (MongoDB Atlas) with proper authentication.

## ❓ Troubleshooting

### Common Issues and Solutions

**🐛 Port already in use**
```bash
# If ports 3001 or 5175 are busy, kill the processes:
npx kill-port 3001 5175
```

**🐳 Docker issues**
```bash
# Reset Docker containers:
npm run docker:down
docker system prune -f
npm run docker:up
```

**📦 Dependency issues**
```bash
# Clean install all dependencies:
rm -rf node_modules frontend/node_modules backend/node_modules
rm package-lock.json frontend/package-lock.json backend/package-lock.json
npm run install:all
```

**🗄️ Database connection issues**
```bash
# Make sure MongoDB is running:
docker ps

# Check if container is healthy:
docker logs points-shop-mongodb
```

## 📸 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Points System
![Points](docs/screenshots/points.png)

### Shop
![Shop](docs/screenshots/shop.png)

### Mood Tracking
![Mood](docs/screenshots/mood.png)

## 📋 Before You Push to GitHub

**Important checklist to ensure security and functionality:**

### ✅ Security Checklist
- [ ] `.env` files are not tracked (check with `git status`)
- [ ] Only `.env.example` files are committed
- [ ] No real database credentials in version control
- [ ] `.gitignore` properly excludes sensitive files

### ✅ Functionality Checklist
- [ ] Application starts successfully with `npm run dev`
- [ ] Database seeds properly with sample data
- [ ] All demo accounts work for login
- [ ] Frontend and backend communicate correctly
- [ ] Docker containers start without errors

### ✅ Documentation Checklist
- [ ] README.md has correct repository URL
- [ ] Installation instructions are accurate
- [ ] Demo accounts are documented
- [ ] Security notes are included

**Quick Verification:**
```bash
# Test the complete setup process
cd MERN-version
npm run install:all
npm run docker:up
npm run setup
npm run dev
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### Development Guidelines
- Follow TypeScript best practices
- Write tests for new features
- Use conventional commit messages
- Ensure all tests pass before submitting
- Update documentation as needed

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

## 🆘 Support & Help

Need help? Here are your options:

- **📖 Documentation**: Check this README and code comments
- **🐛 Bug Reports**: Create an issue on GitHub
- **💡 Feature Requests**: Open an issue with the "enhancement" label
- **💬 Questions**: Start a discussion on GitHub

## 🎯 Future Enhancements

- [ ] Push notifications
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] Social features (comments, likes)
- [ ] Integration with Slack/Teams
- [ ] Multi-tenant support
- [ ] Advanced reporting features

## ⭐ Show Your Support

If you found this project helpful, please consider:
- Giving it a ⭐ star on GitHub
- Sharing it with your team
- Contributing to the project
- Reporting bugs or suggesting features

---

**Built with ❤️ using the MERN Stack**

[MongoDB](https://www.mongodb.com/) • [Express.js](https://expressjs.com/) • [React](https://reactjs.org/) • [Node.js](https://nodejs.org/)
