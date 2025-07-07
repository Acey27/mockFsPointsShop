# 🎉 Cheer a Peer Feature

A peer recognition system that allows employees to give positive feedback and recognition to their colleagues.

## 🌟 Features

### ✅ **Completed Features**

#### 🔍 **Search & Discovery**
- Search users by name with real-time filtering
- Filter users by department (Engineering, Design, Marketing, Sales, HR, Finance, Operations)
- Clean, intuitive search interface with icons and visual feedback

#### 📊 **Statistics Dashboard**
- **Total Heart Bits**: Lifetime points received from colleagues
- **Monthly Points to Give**: Remaining points from monthly allowance (100 points max)
- **Points Received This Month**: Recognition received in current month
- Real-time statistics with beautiful card-based UI

#### 👥 **Peers Who Cheered You**
- View all colleagues who have sent you cheers
- See cheer messages, points given, and timestamps
- Display sender's name, department, and when the cheer was sent
- Paginated list for performance

#### 📢 **Recent Cheers Feed**
- See recent cheers from across the organization
- Public feed showing peer-to-peer recognition
- Displays sender, receiver, message, and points
- Encourages positive culture visibility

#### 🏆 **Leaderboards**
- **Weekly Leaderboard**: Top performers this week
- **Monthly Leaderboard**: Top performers this month  
- **All-Time Leaderboard**: Historical top performers
- Shows ranking, names, departments, total points, and cheer count
- Beautiful ranking display with special styling for top 3

#### 💌 **Send Cheers**
- Send personalized recognition messages
- Award 1-5 points per cheer
- Character limit validation (500 characters)
- Prevent self-cheering
- Monthly limit enforcement (100 points per user)

## 🛠 Technical Implementation

### Backend (Node.js/Express)

#### **Models**
- **Cheer Model** (`src/models/Cheer.js`)
  - Links users with recognition messages
  - Tracks points given (1-5 range)
  - Timestamps for leaderboard calculations
  - Validation to prevent self-cheering

#### **API Endpoints**
- `GET /api/cheer/stats` - User statistics
- `GET /api/cheer/received` - Cheers received by user
- `GET /api/cheer/recent` - Recent cheers feed
- `GET /api/cheer/leaderboards?period=weekly|monthly|alltime` - Leaderboards
- `GET /api/cheer/search-users?query=name&department=dept` - User search
- `POST /api/cheer` - Create new cheer

#### **Business Logic**
- Monthly point limits (100 points per user)
- Aggregated statistics with MongoDB pipeline
- Efficient queries with proper indexing
- Real-time leaderboard calculations

### Frontend (React)

#### **Components**
- **CheerPage** (`src/pages/CheerPage.jsx`)
  - Main page component with all features
  - State management for search, forms, and tabs
  - Real-time data updates with React Query

#### **Features**
- Responsive design with Tailwind CSS
- Real-time search with debouncing
- Modal forms for sending cheers
- Tab-based leaderboard navigation
- Loading states and error handling

#### **Navigation**
- Added to main sidebar navigation
- Heart icon for easy recognition
- Accessible routing with React Router

## 🎨 Design System

### **Color Scheme**
- Primary: Blue tones (existing app colors)
- Heart/Points: Orange/Red for recognition
- Success: Green for positive actions
- Rankings: Gold/Silver/Bronze for top performers

### **Icons**
- Heart icons for cheers and points
- Trophy for leaderboards
- Search and filter icons
- User group icons for peer sections

### **Layout**
- Grid-based responsive design
- Card-based information display
- Clean typography with proper hierarchy
- Consistent spacing and margins

## 🚀 Getting Started

### **Prerequisites**
- Node.js 18+ 
- MongoDB (local or cloud)
- npm or yarn

### **Installation**

1. **Backend Setup**
   ```bash
   cd backend
   npm install
   npm run dev
   ```

2. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Seed Sample Data**
   ```bash
   cd backend
   npm run db:seed:cheers
   ```

### **Quick Start**
```bash
# From the MERN-version directory
./start-cheer-demo.sh
```

### **Test API Endpoints**
```bash
./test-cheer-api.sh
```

## 📱 Usage

### **For Employees**
1. Navigate to "Cheer a Peer" in the sidebar
2. Search for colleagues by name or department
3. Click on a colleague to send them a cheer
4. Write a positive message and select points (1-5)
5. View your statistics and received cheers
6. Check leaderboards for inspiration

### **For Administrators**
- Monitor recognition trends through leaderboards
- Track engagement through cheer statistics
- Encourage positive workplace culture

## 🔧 Configuration

### **Monthly Limits**
- Default: 100 points per user per month
- Configurable in backend business logic
- Prevents point inflation

### **Point Ranges**
- Minimum: 1 point per cheer
- Maximum: 5 points per cheer
- Allows for recognition intensity

## 🧪 Testing

### **API Testing**
```bash
# Test all endpoints
./test-cheer-api.sh

# Manual endpoint testing
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3001/api/cheer/stats
```

### **Frontend Testing**
```bash
cd frontend
npm test
```

## 🚧 Future Enhancements

### **Potential Features**
- [ ] Cheer categories (Teamwork, Innovation, Leadership, etc.)
- [ ] Email notifications for received cheers
- [ ] Cheer analytics dashboard for managers
- [ ] Integration with Slack/Teams
- [ ] Cheer templates for common recognition types
- [ ] Team-based leaderboards
- [ ] Cheer history export functionality
- [ ] Mobile app support

### **Technical Improvements**
- [ ] Redis caching for leaderboards
- [ ] WebSocket for real-time updates
- [ ] Advanced search with filters
- [ ] Image attachments to cheers
- [ ] Cheer reporting and analytics

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Submit a pull request

## 📝 License

This project is part of the Points Shop MERN application.

---

**Built with ❤️ for fostering positive workplace culture**
