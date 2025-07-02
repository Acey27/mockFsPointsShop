import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import PointsPage from '../pages/PointsPage';
import { AuthProvider } from '../contexts/AuthContext';

// Mock data for testing
const mockUser = {
  _id: '1',
  name: 'Test User',
  email: 'test@company.com',
  department: 'Engineering'
};

const mockPoints = {
  availablePoints: 150,
  totalEarned: 200,
  totalSpent: 50,
  monthlyCheerUsed: 30,
  monthlyCheerLimit: 100
};

const mockTransactions = {
  data: [
    {
      _id: '1',
      type: 'received',
      amount: 15,
      description: 'Received cheer from John Doe',
      message: 'Great job on the presentation!',
      fromUserId: {
        _id: '2',
        name: 'John Doe',
        department: 'Marketing'
      },
      createdAt: new Date().toISOString()
    },
    {
      _id: '2',
      type: 'given',
      amount: 10,
      description: 'Cheered Jane Smith',
      message: 'Thanks for the help!',
      toUserId: {
        _id: '3',
        name: 'Jane Smith',
        department: 'Design'
      },
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '3',
      type: 'admin_grant',
      amount: 50,
      description: 'Monthly excellence bonus',
      message: 'Outstanding performance',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '4',
      type: 'spent',
      amount: 25,
      description: 'Redeemed Company T-Shirt',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      _id: '5',
      type: 'earned',
      amount: 20,
      description: 'Automatic point distribution - daily bonus',
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
    }
  ],
  pagination: {
    page: 1,
    limit: 20,
    total: 5,
    pages: 1
  }
};

// Mock API client
jest.mock('../lib/api', () => ({
  apiClient: {
    getUsersForCheering: jest.fn().mockResolvedValue([
      { _id: '2', name: 'John Doe', department: 'Marketing' },
      { _id: '3', name: 'Jane Smith', department: 'Design' }
    ]),
    getTransactions: jest.fn().mockResolvedValue(mockTransactions),
    cheerUser: jest.fn().mockResolvedValue({ success: true })
  }
}));

// Mock auth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: mockUser,
    points: mockPoints
  })
}));

const TestWrapper = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries,
      mutations
    }
  });

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
};

describe('PointsPage Transaction History', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders transaction history section', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    expect(screen.getByText('Transaction History')).toBeInTheDocument();
    expect(screen.getByText(/Chronological log of all point-related activities/)).toBeInTheDocument();
  });

  test('displays transaction filter dropdown', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    const filterSelect = screen.getByDisplayValue('All Transactions');
    expect(filterSelect).toBeInTheDocument();
    
    // Check filter options
    fireEvent.click(filterSelect);
    expect(screen.getByText('📈 Received Points')).toBeInTheDocument();
    expect(screen.getByText('📉 Spent Points')).toBeInTheDocument();
  });

  test('displays transactions with proper formatting', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for transaction titles
      expect(screen.getByText('Received cheer from John Doe')).toBeInTheDocument();
      expect(screen.getByText('Cheered Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('System bonus points')).toBeInTheDocument();
      expect(screen.getByText('Redeemed Company T-Shirt')).toBeInTheDocument();
    });
  });

  test('displays point values with correct colors', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // Check for blue positive values (received)
      const positiveValues = screen.getAllByText(/\+\d+/);
      expect(positiveValues.length).toBeGreaterThan(0);
      
      // Check for red negative values (spent)
      const negativeValues = screen.getAllByText(/-\d+/);
      expect(negativeValues.length).toBeGreaterThan(0);
    });
  });

  test('displays messages for cheer transactions', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Great job on the presentation!')).toBeInTheDocument();
      expect(screen.getByText('Thanks for the help!')).toBeInTheDocument();
      expect(screen.getByText('Outstanding performance')).toBeInTheDocument();
    });
  });

  test('displays date and time for each transaction', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      // Should show relative dates like "Today", "Yesterday", etc.
      expect(screen.getByText(/Today at/)).toBeInTheDocument();
      expect(screen.getByText(/Yesterday at/)).toBeInTheDocument();
    });
  });

  test('displays involved party information', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText(/From: John Doe \(Marketing\)/)).toBeInTheDocument();
      expect(screen.getByText(/To: Jane Smith \(Design\)/)).toBeInTheDocument();
    });
  });

  test('displays transaction type badges', async () => {
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('↗ RECEIVED')).toHaveLength(3); // received, admin_grant, earned
      expect(screen.getAllByText('↙ SPENT')).toHaveLength(2); // given, spent
    });
  });

  test('filters transactions by type', async () => {
    const { apiClient } = require('../lib/api');
    
    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    const filterSelect = screen.getByDisplayValue('All Transactions');
    
    // Filter by received points
    fireEvent.change(filterSelect, { target });
    
    await waitFor(() => {
      expect(apiClient.getTransactions).toHaveBeenCalledWith({ type: 'earned' });
    });

    // Filter by spent points
    fireEvent.change(filterSelect, { target });
    
    await waitFor(() => {
      expect(apiClient.getTransactions).toHaveBeenCalledWith({ type: 'spent' });
    });
  });

  test('handles empty transaction list', async () => {
    const { apiClient } = require('../lib/api');
    apiClient.getTransactions.mockResolvedValueOnce({ data: [], pagination });

    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
      expect(screen.getByText(/Your transaction history will appear here/)).toBeInTheDocument();
    });
  });

  test('handles high value transaction marking', async () => {
    const highValueTransaction = {
      ...mockTransactions,
      data: [{
        _id: '6',
        type: 'received',
        amount: 75, // High value
        description: 'Large bonus',
        createdAt: new Date().toISOString()
      }]
    };

    const { apiClient } = require('../lib/api');
    apiClient.getTransactions.mockResolvedValueOnce(highValueTransaction);

    render(
      <TestWrapper>
        <PointsPage />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('High Value')).toBeInTheDocument();
    });
  });
});

export default {};
