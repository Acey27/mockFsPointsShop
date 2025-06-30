# Points Shop - Full Stack Application

A complete employee recognition and rewards system built with React, Node.js, Express, PostgreSQL, and TypeScript.

## Features

### 🎯 Core Features
- **User Authentication** - JWT-based login/register system
- **Point System** - Earn and spend points for recognition
- **Peer Recognition** - Cheer colleagues with points and messages
- **Rewards Shop** - Redeem points for company swag and gift cards
- **Mood Tracking** - Log and track daily mood with insights
- **Transaction History** - Complete audit trail of all point activities
- **User Profiles** - Manage personal information and avatar

### 🔧 Technical Features
- **Full-Stack TypeScript** - Type safety across frontend and backend
- **Responsive Design** - Works seamlessly on desktop and mobile
- **Real-time Updates** - Live updates for points and transactions
- **Security** - JWT authentication, rate limiting, input validation
- **Database Relations** - Proper foreign keys and constraints
- **API Documentation** - RESTful API with proper error handling

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Axios** for API calls
- **React Router** for navigation
- **Lucide React** for icons
- **Vite** for build tooling

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** database
- **Drizzle ORM** for database queries
- **JWT** for authentication
- **Bcrypt** for password hashing
- **Zod** for input validation
- **CORS, Helmet, Rate Limiting** for security

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 13+
- Git

### 1. Clone and Install Dependencies

```bash
# Clone the repository
git clone <your-repo-url>
cd mockFsPointsShop

# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 2. Database Setup

```bash
# Start PostgreSQL with Docker (recommended)
docker-compose up -d

# Or install PostgreSQL locally and create database
createdb points_shop
```

### 3. Environment Configuration

```bash
# Copy environment files
cp server/.env.example server/.env
cp .env.example .env

# Edit server/.env with your database credentials
# Default settings work with Docker setup
```

### 4. Database Migration and Seeding

```bash
cd server

# Generate and run migrations
npm run db:generate
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### 5. Start Development Servers

```bash
# Terminal 1 - Start backend (from server directory)
cd server
npm run dev

# Terminal 2 - Start frontend (from root directory)
npm run dev
```

### 6. Access the Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Database Admin** (Adminer): http://localhost:8080

## Demo Accounts

The seeded database includes these test accounts:

| Email | Password | Department |
|-------|----------|------------|
| zeann.palma@company.com | password123 | Engineering |
| francis.jelo@company.com | password123 | Design |
| jasfer.delacruz@company.com | password123 | Marketing |
| czar.reenjit@company.com | password123 | Sales |
| john.smith@company.com | password123 | HR |

## Project Structure

```
mockFsPointsShop/
├── src/                          # Frontend React app
│   ├── components/              # UI components
│   ├── contexts/               # React contexts (Auth)
│   ├── lib/                    # API client and utilities
│   └── App.tsx                 # Main app component
├── server/                      # Backend API
│   ├── src/
│   │   ├── db/                 # Database schema and migrations
│   │   ├── routes/             # API route handlers
│   │   ├── middleware/         # Auth and other middleware
│   │   └── server.ts           # Express server setup
│   └── package.json
├── docker-compose.yml          # PostgreSQL database
└── package.json               # Frontend dependencies
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### Points
- `GET /api/points/balance` - Get user point balance
- `GET /api/points/transactions` - Get transaction history
- `POST /api/points/cheer` - Send points to peer

### Shop
- `GET /api/shop/products` - Get products with filtering
- `GET /api/shop/products/:id` - Get single product
- `POST /api/shop/orders` - Place order
- `GET /api/shop/orders` - Get user orders

### Users
- `GET /api/users` - Get users list (for peer selection)
- `GET /api/users/profile` - Get current user profile
- `PUT /api/users/profile` - Update user profile

### Mood
- `POST /api/mood` - Log mood entry
- `GET /api/mood/history` - Get mood history
- `GET /api/mood/insights` - Get mood analytics

## Development Commands

### Frontend
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Backend
```bash
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript
npm run start        # Start production server
npm run db:generate  # Generate database migrations
npm run db:migrate   # Run migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Drizzle Studio (database GUI)
```

## Production Deployment

### Environment Variables

**Backend (.env)**:
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@host:port/database
JWT_SECRET=your-very-long-secure-secret-key
FRONTEND_URL=https://yourdomain.com
```

**Frontend (.env.production)**:
```env
VITE_API_BASE_URL=https://your-api-domain.com/api
```

### Build Steps
```bash
# Build frontend
npm run build

# Build backend
cd server
npm run build

# Run production server
npm start
```

## Database Schema

The application uses a relational PostgreSQL database with the following main tables:

- **users** - User accounts and profiles
- **user_points** - Point balances and limits
- **transactions** - All point movements and history
- **products** - Rewards shop inventory
- **orders** & **order_items** - Purchase history
- **mood_entries** - Mood tracking data
- **product_reviews** - Product ratings and reviews

## Security Features

- **JWT Authentication** with secure token storage
- **Password Hashing** using bcrypt with configurable rounds
- **Rate Limiting** to prevent abuse
- **Input Validation** using Zod schemas
- **CORS Protection** with configurable origins
- **Helmet.js** for security headers
- **SQL Injection Protection** via parameterized queries

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support or questions:
- Create an issue in the GitHub repository
- Review the API documentation
- Check the database schema documentation
