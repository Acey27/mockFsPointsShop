// Simple in-memory database for testing without PostgreSQL
// This is a fallback when the real database is not available

interface User {
  id: number;
  email: string;
  password: string;
  name: string;
  department: string;
  avatar?: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface UserPoints {
  id: number;
  userId: number;
  availablePoints: number;
  totalEarned: number;
  totalSpent: number;
  monthlyCheerLimit: number;
  monthlyCheerUsed: number;
  lastMonthlyReset: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface Transaction {
  id: number;
  fromUserId?: number;
  toUserId: number;
  type: string;
  amount: number;
  description: string;
  message?: string;
  metadata?: any;
  createdAt: Date;
}

interface Product {
  id: number;
  name: string;
  description: string;
  pointsCost: number;
  category: string;
  inventory: number;
  image?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

interface MoodEntry {
  id: number;
  userId: number;
  mood: string;
  comment?: string;
  date: Date;
}

class InMemoryDB {
  private users: User[] = [];
  private userPoints: UserPoints[] = [];
  private transactions: Transaction[] = [];
  private products: Product[] = [];
  private moodEntries: MoodEntry[] = [];
  private nextId = 1;

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Add sample products
    this.products = [
      {
        id: 1,
        name: "Coffee Mug",
        description: "Premium ceramic coffee mug with company logo",
        pointsCost: 50,
        category: "merchandise",
        inventory: 25,
        image: "https://via.placeholder.com/300x200?text=Coffee+Mug",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: "T-Shirt",
        description: "Comfortable cotton t-shirt with team logo",
        pointsCost: 100,
        category: "merchandise",
        inventory: 15,
        image: "https://via.placeholder.com/300x200?text=T-Shirt",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: "Extra PTO Day",
        description: "One additional paid time off day",
        pointsCost: 200,
        category: "benefits",
        inventory: 100,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    this.nextId = 4;
  }

  // User operations
  async createUser(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const user: User = {
      ...userData,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.users.push(user);
    return [user];
  }

  async findUserByEmail(email: string) {
    const user = this.users.find(u => u.email === email);
    return user ? [user] : [];
  }

  async findUserById(id: number) {
    const user = this.users.find(u => u.id === id);
    return user ? [user] : [];
  }

  async getActiveUsers(excludeId?: number) {
    return this.users.filter(u => u.isActive && u.id !== excludeId);
  }

  // User points operations
  async createUserPoints(data: Omit<UserPoints, 'id' | 'createdAt' | 'updatedAt'>) {
    const points: UserPoints = {
      ...data,
      id: this.nextId++,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.userPoints.push(points);
    return [points];
  }

  async getUserPoints(userId: number) {
    const points = this.userPoints.find(p => p.userId === userId);
    return points ? [points] : [];
  }

  async updateUserPoints(userId: number, updates: Partial<UserPoints>) {
    const index = this.userPoints.findIndex(p => p.userId === userId);
    if (index >= 0) {
      this.userPoints[index] = { ...this.userPoints[index], ...updates, updatedAt: new Date() };
      return [this.userPoints[index]];
    }
    return [];
  }

  // Transaction operations
  async createTransaction(data: Omit<Transaction, 'id' | 'createdAt'>) {
    const transaction: Transaction = {
      ...data,
      id: this.nextId++,
      createdAt: new Date()
    };
    this.transactions.push(transaction);
    return [transaction];
  }

  async getUserTransactions(userId: number, limit: number = 20, offset: number = 0) {
    return this.transactions
      .filter(t => t.toUserId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .slice(offset, offset + limit);
  }

  // Product operations
  async getProducts(limit: number = 20, offset: number = 0) {
    return this.products
      .filter(p => p.isActive)
      .slice(offset, offset + limit);
  }

  async getProductById(id: number) {
    const product = this.products.find(p => p.id === id && p.isActive);
    return product ? [product] : [];
  }

  // Mood operations
  async createMoodEntry(data: Omit<MoodEntry, 'id' | 'date'>) {
    const entry: MoodEntry = {
      ...data,
      id: this.nextId++,
      date: new Date()
    };
    this.moodEntries.push(entry);
    return [entry];
  }

  async getUserMoodHistory(userId: number, days: number = 30, limit: number = 20, offset: number = 0) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    
    return this.moodEntries
      .filter(m => m.userId === userId && m.date >= cutoff)
      .sort((a, b) => b.date.getTime() - a.date.getTime())
      .slice(offset, offset + limit);
  }

  // Simulate transaction
  async transaction(callback: (tx: InMemoryDB) => Promise<any>) {
    return await callback(this);
  }
}

export const memoryDB = new InMemoryDB();
export default memoryDB;
