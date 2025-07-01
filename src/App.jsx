import React, { useState } from "react";
import PulseSurvey from "./pulseSurvey.jsx";
import EmployeeServicesCenter from "./employeeServicesCenter.jsx";
import TailoredGuidance from "./tailoredGuidance.jsx";
import {
  TrendingUp,
  Award,
  Heart,
  Smile,
  Calendar,
  Gift,
  ArrowLeft,
  Search,
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  Star,
} from "lucide-react";

// Mock data and utilities
const mockUsers = [
  {
    id: "1",
    name: "Zeann Palma",
    department: "Engineering",
    avatar:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
  {
    id: "2",
    name: "Francis Jelo",
    department: "Design",
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
  {
    id: "3",
    name: "Jasfer DelaCruz",
    department: "Marketing",
    avatar:
      "https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
  {
    id: "4",
    name: "Czar Reenjit",
    department: "Sales",
    avatar:
      "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
  {
    id: "5",
    name: "John Smith",
    department: "HR",
    avatar:
      "https://images.pexels.com/photos/697509/pexels-photo-697509.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
];

const mockProducts = [
  {
    id: "1",
    name: "Company T-Shirt",
    description: "Premium cotton t-shirt with company logo",
    image:
      "https://images.pexels.com/photos/8532616/pexels-photo-8532616.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 150,
    category: "apparel",
    inventory: 25,
    rating: 4.5,
  },
  {
    id: "2",
    name: "Coffee Mug",
    description: "Ceramic mug perfect for your morning coffee",
    image:
      "https://images.pexels.com/photos/302894/pexels-photo-302894.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 75,
    category: "accessories",
    inventory: 50,
    rating: 4.8,
  },
  {
    id: "3",
    name: "Wireless Earbuds",
    description: "High-quality bluetooth earbuds",
    image:
      "https://images.pexels.com/photos/3587478/pexels-photo-3587478.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 500,
    category: "electronics",
    inventory: 10,
    rating: 4.7,
  },
  {
    id: "4",
    name: "Desk Plant",
    description: "Small succulent plant for your workspace",
    image:
      "https://images.pexels.com/photos/1084199/pexels-photo-1084199.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 100,
    category: "office",
    inventory: 30,
    rating: 4.6,
  },
  {
    id: "5",
    name: "Gift Card - $25",
    description: "Amazon gift card worth $25",
    image:
      "https://images.pexels.com/photos/264787/pexels-photo-264787.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 300,
    category: "giftcards",
    inventory: 100,
    rating: 5.0,
  },
  {
    id: "6",
    name: "Notebook Set",
    description: "Premium notebook and pen set",
    image:
      "https://images.pexels.com/photos/167682/pexels-photo-167682.jpeg?auto=compress&cs=tinysrgb&w=400",
    pointsCost: 120,
    category: "office",
    inventory: 40,
    rating: 4.4,
  },
];

const mockTransactions = [
  {
    id: "1",
    type: "earned",
    amount: 25,
    description: "Received cheer from Czar Reenjit",
    message: "Great job on the presentation!",
    date: "2025-06-23T10:30:00Z",
    avatar:
      "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
  {
    id: "2",
    type: "spent",
    amount: -150,
    description: "Redeemed Company T-Shirt",
    date: "2025-06-22T15:45:00Z",
    avatar: null,
  },
  {
    id: "3",
    type: "given",
    amount: -15,
    description: "Cheered Francis Jelo",
    message: "Thanks for helping with the project",
    date: "2025-06-22T09:15:00Z",
    avatar:
      "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
  {
    id: "4",
    type: "earned",
    amount: 30,
    description: "Received cheer from Jasfer DelaCruz",
    message: "Outstanding work this week!",
    date: "2025-06-21T16:20:00Z",
    avatar:
      "https://images.pexels.com/photos/718978/pexels-photo-718978.jpeg?auto=compress&cs=tinysrgb&w=40",
  },
];

// Utility function
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// UI Components
const Card = ({
  children,
  className = "",
}) => (
  <div
    className={`bg-white rounded-xl border border-blue-100 shadow-md ${className}`}
  >
    {children}
  </div>
);

const CardHeader = ({
  children,
  className = "",
}) => (
  <div className={`p-6 pb-3 ${className}`}>{children}</div>
);

const CardContent = ({
  children,
  className = "",
}) => (
  <div className={`p-6 pt-0 ${className}`}>{children}</div>
);

const CardTitle = ({
  children,
  className = "",
}) => (
  <h3
    className={`text-lg font-semibold text-blue-900 tracking-tight ${className}`}
  >
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className = "",
}) => (
  <p className={`text-sm text-blue-600 mt-1 ${className}`}>{children}</p>
);

const Button = ({
  children,
  onClick,
  disabled = false,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
}) => {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm";

  const variants = {
    primary: "bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-500",
    secondary: "bg-blue-100 text-blue-900 hover:bg-blue-200 focus:ring-blue-400",
    outline: "border border-blue-300 bg-white text-blue-700 hover:bg-blue-50 focus:ring-blue-400",
    ghost: "text-blue-700 hover:bg-blue-100 focus:ring-blue-400",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input = ({
  placeholder,
  value,
  onChange,
  type = "text",
  className = "",
  id
}) => (
  <input
    id={id}
    type={type}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-blue-900 bg-blue-50 placeholder-blue-400 ${className}`}
  />
);

const Textarea = ({
  placeholder,
  value,
  onChange,
  rows = 3,
  className = "",
  id
}) => (
  <textarea
    id={id}
    placeholder={placeholder}
    value={value}
    onChange={onChange}
    rows={rows}
    className={`w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent resize-none text-blue-900 bg-blue-50 placeholder-blue-400 ${className}`}
  />
);

const Select = ({
  value,
  onChange,
  children,
  className = "",
}) => (
  <select
    value={value}
    onChange={onChange}
    className={`w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-blue-900 bg-blue-50 ${className}`}
  >
    {children}
  </select>
);

const Badge = ({
  children,
  variant = "default",
  className = "",
}) => {
  const variants = {
    default: "bg-blue-100 text-blue-800 border border-blue-200",
    secondary: "bg-blue-50 text-blue-700 border border-blue-100",
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-yellow-100 text-yellow-800 border border-yellow-200",
    error: "bg-red-100 text-red-800 border border-red-200",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

const Avatar = ({
  src,
  alt,
  fallback,
  className = "",
}) => (
  <div
    className={`relative inline-block ${className}`}
    style={{ minWidth: 32, minHeight: 32 }}
  >
    {src ? (
      <img
        src={src}
        alt={alt}
        className="w-full h-full rounded-full object-cover border border-blue-100"
      />
    ) : (
      <div className="w-full h-full rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
        {fallback}
      </div>
    )}
  </div>
);

const Progress = ({
  value,
  max = 100,
  className = "",
}) => (
  <div className={`w-full bg-blue-100 rounded-full h-2 ${className}`}>
    <div
      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
    />
  </div>
);

// Main Shop Component
const Shop = () => {
  const [activeView, setActiveView] = useState("dashboard");
  const [pulseOpen, setPulseOpen] = useState(true);
  const [userPoints, setUserPoints] = useState({
    available: 850,
    earned: 1200,
    spent: 350,
    monthlyLimit: 100,
    monthlyUsed: 45,
  });

  // Cheer a Peer state
  const [selectedUser, setSelectedUser] = useState("");
  const [cheerPoints, setCheerPoints] = useState("");
  const [cheerMessage, setCheerMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Rewards Shop state
  const [cart, setCart] = useState({});
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [shopSearchTerm, setShopSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");

  // Mood Tracker state
  const [selectedMood, setSelectedMood] = useState("");
  const [moodComment, setMoodComment] = useState("");

  const recentCheers = [
    {
      id: 1,
      from: "Zeann Palma",
      to: "You",
      points: 25,
      message: "Great job on the presentation!",
      time: "2 hours ago",
    },
    {
      id: 2,
      from: "You",
      to: "Francis Jelo",
      points: 15,
      message: "Thanks for helping with the project",
      time: "1 day ago",
    },
    {
      id: 3,
      from: "Jasfer DelaCruz",
      to: "You",
      points: 30,
      message: "Outstanding work this week!",
      time: "2 days ago",
    },
  ];

  const moods = [
    {
      emoji: "😄",
      label: "Excellent",
      value: "excellent",
      color: "bg-green-100 border-green-300",
    },
    {
      emoji: "😊",
      label: "Good",
      value: "good",
      color: "bg-blue-100 border-blue-300",
    },
    {
      emoji: "😐",
      label: "Okay",
      value: "okay",
      color: "bg-yellow-100 border-yellow-300",
    },
    {
      emoji: "😔",
      label: "Not Great",
      value: "not-great",
      color: "bg-orange-100 border-orange-300",
    },
    {
      emoji: "😞",
      label: "Poor",
      value: "poor",
      color: "bg-red-100 border-red-300",
    },
  ];

  const categories = [
    { value: "all", label: "All Categories" },
    { value: "apparel", label: "Apparel" },
    { value: "accessories", label: "Accessories" },
    { value: "electronics", label: "Electronics" },
    { value: "office", label: "Office Supplies" },
    { value: "giftcards", label: "Gift Cards" },
  ];

  // Filter functions
  const filteredUsers = mockUsers.filter(
    (user) =>
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(shopSearchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(shopSearchTerm.toLowerCase());
    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  // Cart functions
  const addToCart = (productId) => {
    setCart((prev) => ({
      ...prev,
      [productId]: (prev[productId] || 0) + 1,
    }));
    showNotification("Added to cart!");
  };

  const updateCartQuantity = (productId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prev) => ({
      ...prev,
      [productId]: newQuantity,
    }));
  };

  const removeFromCart = (productId) => {
    setCart((prev) => {
      const newCart = { ...prev };
      delete newCart[productId];
      return newCart;
    });
    showNotification("Removed from cart");
  };

  const getTotalCartPoints = () => {
    return Object.entries(cart).reduce((total, [productId, quantity]) => {
      const product = mockProducts.find((p) => p.id === productId);
      return total + (product?.pointsCost || 0) * quantity;
    }, 0);
  };

  const getCartItems = () => {
    return Object.entries(cart)
      .map(([productId, quantity]) => {
        const product = mockProducts.find((p) => p.id === productId);
        return { product, quantity };
      })
      .filter((item) => item.product);
  };

  // Handle functions
  const handlePointsSpent = (pointsSpent) => {
    setUserPoints((prev) => ({
      ...prev,
      available: prev.available - pointsSpent,
      spent: prev.spent + pointsSpent,
    }));
  };

  const handleCheerSubmit = (e) => {
    e.preventDefault();
    if (!selectedUser || !cheerPoints || !cheerMessage) {
      showNotification("Please fill in all fields", "error");
      return;
    }

    const pointsNum = Number.parseInt(cheerPoints);
    if (pointsNum < 1 || pointsNum > 50) {
      showNotification("Points must be between 1 and 50", "error");
      return;
    }

    showNotification(
      `Cheer sent to ${mockUsers.find((u) => u.id === selectedUser)?.name}!`,
    );
    setSelectedUser("");
    setCheerPoints("");
    setCheerMessage("");
    setSearchTerm("");
  };

  const handleCheckout = async () => {
    const totalPoints = getTotalCartPoints();

    if (totalPoints > userPoints.available) {
      showNotification("Insufficient points for checkout", "error");
      return;
    }

    if (Object.keys(cart).length === 0) {
      showNotification("Your cart is empty", "error");
      return;
    }

    setIsCheckingOut(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      handlePointsSpent(totalPoints);
      setCart({});

      const itemCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
      showNotification(
        `Order placed successfully! ${itemCount} item${
          itemCount > 1 ? "s" : ""
        } ordered for ${totalPoints} points.`,
      );
    } catch (error) {
      showNotification("Checkout failed. Please try again.", "error");
    } finally {
      setIsCheckingOut(false);
    }
  };

  const handleMoodSubmit = (e) => {
    e.preventDefault();
    if (!selectedMood) {
      showNotification("Please select your mood", "error");
      return;
    }

    showNotification("Mood logged successfully!");
    setSelectedMood("");
    setMoodComment("");
  };

  const getTransactionIcon = (type) => {
    switch (type) {
      case "earned":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
      case "spent":
        return <Gift className="w-4 h-4 text-blue-600" />;
      case "given":
        return <Heart className="w-4 h-4 text-pink-600" />;
      default:
        return <TrendingUp className="w-4 h-4 text-gray-600" />;
    }
  };

  // Render functions for different views
  const renderDashboard = () => (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">My Pulse Dashboard</h1>
          <p className="text-blue-600">Welcome back! Here's your activity overview.</p>
        </div>
        <Badge variant="secondary" className="text-sm">
          <Calendar className="w-4 h-4 mr-1" />
          {new Date().toLocaleDateString()}
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Available Points
            </CardTitle>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {userPoints.available}
            </div>
            <p className="text-xs text-blue-600">Ready to spend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Points Earned
            </CardTitle>
            <Award className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {userPoints.earned}
            </div>
            <p className="text-xs text-blue-600">Total lifetime</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Monthly Cheers
            </CardTitle>
            <Heart className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {userPoints.monthlyUsed}
            </div>
            <p className="text-xs text-blue-600">
              of {userPoints.monthlyLimit} limit
            </p>
            <Progress
              value={(userPoints.monthlyUsed / userPoints.monthlyLimit) * 100}
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-700">
              Mood Status
            </CardTitle>
            <Smile className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">😊</div>
            <p className="text-xs text-blue-600">Feeling good today</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Button onClick={() => setActiveView("cheer")} className="h-20 flex-col gap-2">
          <Heart className="w-5 h-5" />
          Cheer a Peer
        </Button>
        <Button onClick={() => setActiveView("shop")} variant="outline" className="h-20 flex-col gap-2">
          <Gift className="w-5 h-5" />
          Rewards Shop
        </Button>
        <Button onClick={() => setActiveView("points")} variant="outline" className="h-20 flex-col gap-2">
          <TrendingUp className="w-5 h-5" />
          View Points
        </Button>
        <Button onClick={() => setActiveView("mood")} variant="outline" className="h-20 flex-col gap-2">
          <Smile className="w-5 h-5" />
          Mood Check
        </Button>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-blue-900">Recent Cheers</CardTitle>
          <CardDescription className="text-blue-600">
            Your latest peer recognition activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentCheers.map((cheer) => (
              <div
                key={cheer.id}
                className="flex items-center gap-4 p-3 rounded-lg border border-blue-200 bg-blue-50"
              >
                <Avatar
                  src="https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=40"
                  fallback={cheer.from
                    .split(" ")
                    .map((n) => n[0])
                    .join("")}
                  className="h-10 w-10"
                />
                <div className="flex-1">
                  <p className="text-sm text-blue-900">
                    <span className="font-medium">{cheer.from}</span> cheered{" "}
                    <span className="font-medium">{cheer.to}</span>
                  </p>
                  <p className="text-xs text-blue-600">{cheer.message}</p>
                </div>
                <div className="text-right">
                  <Badge>+{cheer.points} pts</Badge>
                  <p className="text-xs text-blue-600 mt-1">{cheer.time}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCheerPeer = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveView("dashboard")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Cheer a Peer</h1>
          <p className="text-blue-600">
            Recognize your colleagues with points and appreciation
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Heart className="w-5 h-5 text-red-500" />
              Send Recognition
            </CardTitle>
            <CardDescription className="text-blue-600">
              You have{" "}
              {userPoints.monthlyLimit - userPoints.monthlyUsed} points remaining
              this month (out of{" "}
              {userPoints.monthlyLimit} monthly limit)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCheerSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="search"
                  className="block text-sm font-medium text-gray-700"
                >
                  Search Colleagues
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or department..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Select Colleague
                </label>
                <div className="grid gap-2 max-h-48 overflow-y-auto">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedUser === user.id
                          ? "border-blue-500 bg-blue-50"
                          : "hover:bg-gray-50 border-gray-200"
                      }`}
                      onClick={() => setSelectedUser(user.id)}
                    >
                      <Avatar
                        src={user.avatar}
                        fallback={user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                        className="h-10 w-10"
                      />
                      <div className="flex-1">
                        <p className="font-medium text-blue-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.department}</p>
                      </div>
                      {selectedUser === user.id && <Badge>Selected</Badge>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="points"
                  className="block text-sm font-medium text-gray-700"
                >
                  Points to Give (1-50)
                </label>
                <Input
                  id="points"
                  type="number"
                  placeholder="Enter points..."
                  value={cheerPoints}
                  onChange={(e) => setCheerPoints(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700"
                >
                  Recognition Message
                </label>
                <Textarea
                  id="message"
                  placeholder="Write a message to recognize their great work..."
                  value={cheerMessage}
                  onChange={(e) => setCheerMessage(e.target.value)}
                  rows={4}
                />
              </div>

              <Button type="submit" className="w-full">
                <Heart className="w-4 h-4 mr-2" />
                Send Cheer
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-blue-900">Recognition Tips</CardTitle>
            <CardDescription className="text-blue-600">
              Make your cheers more meaningful
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-500 mt-2" />
                <div>
                  <p className="font-medium text-blue-900">Be Specific</p>
                  <p className="text-sm text-blue-600">
                    Mention exactly what they did well to make the recognition
                    more meaningful.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-600 mt-2" />
                <div>
                  <p className="font-medium text-blue-900">Timely Recognition</p>
                  <p className="text-sm text-blue-600">
                    Send cheers soon after the great work happens for maximum
                    impact.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-blue-700 mt-2" />
                <div>
                  <p className="font-medium text-blue-900">Point Guidelines</p>
                  <p className="text-sm text-blue-600">
                    Small helps: 5-15 points • Great work: 15-30 points •
                    Outstanding: 30-50 points
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRewardsShop = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveView("dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-blue-900">Rewards Shop</h1>
            <p className="text-blue-600">Redeem your points for amazing rewards</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-lg px-3 py-1">
            {userPoints.available} points available
          </Badge>
          {Object.keys(cart).length > 0 && (
            <Button
              onClick={handleCheckout}
              disabled={
                isCheckingOut || getTotalCartPoints() > userPoints.available
              }
            >
              {isCheckingOut ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  Checkout ({getTotalCartPoints()} pts)
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Shopping Cart Summary */}
      {Object.keys(cart).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <ShoppingCart className="w-5 h-5" />
              Shopping Cart (
              {Object.values(cart).reduce((sum, qty) => sum + qty, 0)} items)
            </CardTitle>
            <CardDescription className="text-blue-600">
              Review your items before checkout
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {getCartItems().map(({ product, quantity }) => (
                <div
                  key={product?.id}
                  className="flex items-center gap-4 p-3 rounded-lg border border-blue-200 bg-blue-50"
                >
                  <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
                    <Gift className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-blue-900">{product?.name}</p>
                    <p className="text-sm text-blue-600">
                      {product?.pointsCost} pts each
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(product?.id, quantity - 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <span className="w-8 text-center font-medium">{quantity}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => updateCartQuantity(product?.id, quantity + 1)}
                      className="h-8 w-8 p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFromCart(product?.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-right">
                    <Badge>{product ? product.pointsCost * quantity : 0} pts</Badge>
                  </div>
                </div>
              ))}
              <div className="border-t border-blue-200 pt-3 flex justify-between items-center">
                <span className="font-semibold text-blue-900">Total:</span>
                <Badge className="text-lg px-3 py-1">
                  {getTotalCartPoints()} points
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
          <Input
            placeholder="Search products..."
            value={shopSearchTerm}
            onChange={(e) => setShopSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="w-48"
        >
          {categories.map((category) => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </Select>
      </div>

      {/* Products Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square bg-blue-50">
              <img
                src={product.image}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg text-blue-900">
                    {product.name}
                  </CardTitle>
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                    <span className="text-sm text-blue-600">
                      {product.rating}
                    </span>
                  </div>
                </div>
                <Badge className="text-lg font-bold">
                  {product.pointsCost} pts
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <CardDescription className="mb-4 text-blue-600">
                {product.description}
              </CardDescription>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-blue-600">
                  {product.inventory} in stock
                </span>
                {cart[product.id] && (
                  <Badge variant="secondary">{cart[product.id]} in cart</Badge>
                )}
              </div>
              <Button
                onClick={() => addToCart(product.id)}
                disabled={
                  product.pointsCost > userPoints.available ||
                  product.inventory === 0
                }
                className="w-full"
              >
                <Gift className="w-4 h-4 mr-2" />
                {product.pointsCost > userPoints.available
                  ? "Insufficient Points"
                  : product.inventory === 0
                  ? "Out of Stock"
                  : "Add to Cart"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <Gift className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">No products found</h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );

  const renderPointsHistory = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveView("dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Points History</h1>
          <p className="text-blue-600">Track your points earnings and spending</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Available Points
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {userPoints.available}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Earned
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {userPoints.earned}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {userPoints.spent}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-700">
              Monthly Usage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">
              {userPoints.monthlyUsed}/{userPoints.monthlyLimit}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-900">
            <Calendar className="w-5 h-5" />
            Transaction History
          </CardTitle>
          <CardDescription className="text-blue-600">
            Your complete points activity log
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockTransactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center gap-4 p-4 rounded-lg border border-blue-200 bg-blue-50"
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-blue-200">
                  {getTransactionIcon(transaction.type)}
                </div>

                {transaction.avatar && (
                  <Avatar src={transaction.avatar} fallback="U" className="h-10 w-10" />
                )}

                <div className="flex-1">
                  <p className="font-medium text-blue-900">
                    {transaction.description}
                  </p>
                  {transaction.message && (
                    <p className="text-sm text-blue-600 italic">
                      "{transaction.message}"
                    </p>
                  )}
                  <p className="text-xs text-blue-600 mt-1">
                    {formatDate(transaction.date)}
                  </p>
                </div>

                <div className="text-right">
                  <Badge variant={transaction.amount > 0 ? "default" : "secondary"}>
                    {transaction.amount > 0 ? "+" : ""}
                    {transaction.amount} pts
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderMoodTracker = () => (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => setActiveView("dashboard")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Mood Check-in</h1>
          <p className="text-blue-600">How are you feeling today?</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-900">
              <Smile className="w-5 h-5 text-blue-600" />
              Today's Mood
            </CardTitle>
            <CardDescription className="text-blue-600">
              Select how you're feeling and optionally add a comment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleMoodSubmit} className="space-y-6">
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  How are you feeling?
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {moods.map((mood) => (
                    <div
                      key={mood.value}
                      className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedMood === mood.value
                          ? `${mood.color} border-opacity-100`
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      onClick={() => setSelectedMood(mood.value)}
                    >
                      <span className="text-3xl">{mood.emoji}</span>
                      <div>
                        <p className="font-medium">{mood.label}</p>
                        <p className="text-sm text-gray-600">
                          I'm feeling {mood.label.toLowerCase()} today
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="comment"
                  className="block text-sm font-medium text-gray-700"
                >
                  Optional Comment
                </label>
                <Textarea
                  id="comment"
                  placeholder="Share what's contributing to your mood today..."
                  value={moodComment}
                  onChange={(e) => setMoodComment(e.target.value)}
                  rows={3}
                />
              </div>

              <Button type="submit" className="w-full">
                <Smile className="w-4 h-4 mr-2" />
                Log My Mood
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <TrendingUp className="w-5 h-5 text-blue-600" />
                Mood Insights
              </CardTitle>
              <CardDescription className="text-blue-600">
                Your mood trends this week
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">Average Mood</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">😊</span>
                    <span className="font-medium text-blue-900">Good</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">Best Day</span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">😄</span>
                    <span className="font-medium text-blue-900">Yesterday</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-blue-600">Check-in Streak</span>
                  <span className="font-medium text-blue-900">5 days</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-900">
                <Calendar className="w-5 h-5 text-blue-600" />
                Recent Check-ins
              </CardTitle>
              <CardDescription className="text-blue-600">
                Your mood history
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  {
                    date: "2025-06-23",
                    mood: "😊",
                    label: "Good",
                    comment: "Great team meeting today!",
                  },
                  {
                    date: "2025-06-22",
                    mood: "😄",
                    label: "Excellent",
                    comment: "Finished the project successfully",
                  },
                  {
                    date: "2025-06-21",
                    mood: "😐",
                    label: "Okay",
                    comment: "Busy day with lots of meetings",
                  },
                  {
                    date: "2025-06-20",
                    mood: "😊",
                    label: "Good",
                    comment: "Good progress on tasks",
                  },
                  {
                    date: "2025-06-19",
                    mood: "😄",
                    label: "Excellent",
                    comment: "Received great feedback from client",
                  },
                ].map((entry, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    <span className="text-2xl">{entry.mood}</span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-blue-900">{entry.label}</span>
                        <span className="text-xs text-blue-600">
                          {new Date(entry.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      </div>
                      {entry.comment && (
                        <p className="text-sm text-blue-600 mt-1">{entry.comment}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );

  // Notification state and functions (moved inside Shop)
  const [notification, setNotification] = useState(null);

  const showNotification = (
    message,
    type = "success",
    onOk,
    onCancel
  ) => {
    setNotification({ message, type, onOk, onCancel });
  };

  const closeNotification = () => setNotification(null);

  const renderContent = () => {
    switch (activeView) {
      case "dashboard":
        return renderDashboard();
      case "mood":
        return renderMoodTracker();
      case "cheer":
        return renderCheerPeer();
      case "shop":
        return renderRewardsShop();
      case "points":
        return renderPointsHistory();
      case "pulseSurvey":
        return <PulseSurvey />;
      case "employeeServices":
        return <EmployeeServicesCenter />;
      case "tailoredGuidance":
        return <TailoredGuidance />;
      default:
        return renderDashboard();
    }
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-blue-100 flex flex-col">
        <div className="p-6">
          <div className="font-bold text-lg text-blue-900 mb-4">My Pulse</div>
          <button
            className="flex items-center w-full text-left text-blue-900 font-semibold focus:outline-none"
            onClick={() => setPulseOpen(!pulseOpen)}
          >
            <span className="mr-2"></span> My Pulse Dashboard
            <span className="ml-auto text-blue-700">{pulseOpen ? "▲" : "▼"}</span>
          </button>
          {pulseOpen && (
            <ul className="mt-2 ml-4 space-y-1">
              <li>
                <button
                  className={`block w-full text-left py-1 px-2 rounded ${
                    activeView === "mood"
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-800 hover:bg-blue-50"
                  }`}
                  onClick={() => setActiveView("mood")}
                >
                  Mood Tracker
                </button>
              </li>
              <li>
                <button
                  className={`block w-full text-left py-1 px-2 rounded ${
                    activeView === "cheer"
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-800 hover:bg-blue-50"
                  }`}
                  onClick={() => setActiveView("cheer")}
                >
                  Cheer a Peer
                </button>
              </li>
              <li>
                <button
                  className={`block w-full text-left py-1 px-2 rounded ${
                    activeView === "shop"
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-800 hover:bg-blue-50"
                  }`}
                  onClick={() => setActiveView("shop")}
                >
                  Rewards Center
                </button>
              </li>
              <li>
                <button
                  className={`block w-full text-left py-1 px-2 rounded ${
                    activeView === "points"
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-800 hover:bg-blue-50"
                  }`}
                  onClick={() => setActiveView("points")}
                >
                  Transactions
                </button>
              </li>
              <li>
                <button
                  className={`block w-full text-left py-1 px-2 rounded ${
                    activeView === "pulseSurvey"
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-800 hover:bg-blue-50"
                  }`}
                  onClick={() => setActiveView("pulseSurvey")}
                >
                  Anonymous Pulse Survey
                </button>
              </li>
              <li>
                <button
                  className={`block w-full text-left py-1 px-2 rounded ${
                    activeView === "employeeServices"
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-800 hover:bg-blue-50"
                  }`}
                  onClick={() => setActiveView("employeeServices")}
                >
                  Employee Services Center
                </button>
              </li>
              <li>
                <button
                  className={`block w-full text-left py-1 px-2 rounded ${
                    activeView === "tailoredGuidance"
                      ? "bg-blue-100 text-blue-900"
                      : "text-gray-800 hover:bg-blue-50"
                  }`}
                  onClick={() => setActiveView("tailoredGuidance")}
                >
                  Tailored Guidance
                </button>
              </li>
            </ul>
          )}
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default Shop;