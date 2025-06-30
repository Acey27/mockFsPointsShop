import { Router } from 'express';

const router = Router();

// Demo endpoints that work without database
router.get('/status', (_req, res) => {
  res.json({
    message: 'Demo mode active',
    features: [
      'Health check',
      'API documentation',
      'Demo data endpoints'
    ],
    database: 'In-memory (demo)',
    note: 'To enable full functionality, set up PostgreSQL database'
  });
});

router.get('/sample-user', (_req, res) => {
  res.json({
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    department: 'Engineering',
    points: 150,
    transactions: [
      {
        id: 1,
        type: 'earned',
        amount: 50,
        description: 'Welcome bonus',
        date: new Date().toISOString()
      },
      {
        id: 2,
        type: 'earned',
        amount: 100,
        description: 'Completed project',
        date: new Date(Date.now() - 86400000).toISOString()
      }
    ]
  });
});

router.get('/sample-products', (_req, res) => {
  res.json({
    products: [
      {
        id: 1,
        name: 'Coffee Mug',
        description: 'Premium ceramic coffee mug',
        pointsCost: 50,
        category: 'merchandise',
        inventory: 25,
        image: 'https://via.placeholder.com/300x200?text=Coffee+Mug'
      },
      {
        id: 2,
        name: 'T-Shirt',
        description: 'Comfortable cotton t-shirt',
        pointsCost: 100,
        category: 'merchandise',
        inventory: 15,
        image: 'https://via.placeholder.com/300x200?text=T-Shirt'
      },
      {
        id: 3,
        name: 'Extra PTO Day',
        description: 'One additional paid time off day',
        pointsCost: 200,
        category: 'benefits',
        inventory: 100
      }
    ]
  });
});

export default router;
