import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  ShoppingCartIcon,
  StarIcon,
  ChartBarIcon,
  MagnifyingGlassIcon
} from '@heroicons/react/24/outline';

const ShopPage= () => {
  const { refreshUserData } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);

  // Fetch user's points data with React Query to enable auto-refresh
  const { data: points, isLoading: pointsLoading } = useQuery({
    queryKey: ['points'],
    queryFn: () => apiClient.getPoints(),
    staleTime: 30000, // 30 seconds
    refetchInterval: 60000, // Refetch every minute
    refetchOnWindowFocus: true,
  });

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', { search: searchTerm, category: selectedCategory }],
    queryFn: () => apiClient.getProducts({ 
      search: searchTerm || undefined, 
      category: selectedCategory || undefined 
    }),
  });

  // Purchase mutation
  const purchaseMutation = useMutation({
    mutationFn: (orderData) =>
      apiClient.checkout({ 
        items: orderData.items,
        shippingAddress: {
          name: 'User',
          email: 'user@example.com',
          address: '123 Main St',
          city: 'Anytown',
          state: 'CA',
          zipCode: '12345',
          country: 'United States'
        }
      }),
    onSuccess: (data) => {
      // Invalidate all relevant queries to refresh UI across all pages
      queryClient.invalidateQueries({ queryKey: ['points'] });
      queryClient.invalidateQueries({ queryKey: ['orderHistory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      
      // Clear cart after successful purchase
      setCart([]);
      
      // Navigate to success page
      navigate('/purchase-success', { 
        state: { 
          receipt: data.receipt,
          newBalance: data.newBalance 
        } 
      });
    },
    onError: (error) => {
      alert(error.message || 'Purchase failed');
    }
  });

  const addToCart = (productId) => {
    setCart(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item =>
        item.productId === productId ? { ...item, quantity } : item
      )
    );
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => {
      const product = products?.data?.find((p) => p._id === item.productId);
      return total + (product?.pointsCost || 0) * item.quantity;
    }, 0);
  };

  const getCartItemCount = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const handlePurchase = () => {
    if (cart.length > 0) {
      purchaseMutation.mutate({ items: cart });
    }
  };

  const categories = Array.from(new Set(products?.data?.map((p) => p.category) || []));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-blue-900">Rewards Shop</h1>
          <p className="text-blue-600">Redeem your points for amazing rewards</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="bg-white px-4 py-2 rounded-lg shadow-sm border border-blue-100">
            <div className="flex items-center space-x-2">
              <ChartBarIcon className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">
                {pointsLoading ? 'Loading...' : `${points?.availablePoints || 0} points available`}
              </span>
            </div>
          </div>
          {cart.length > 0 && (
            <div className="relative">
              <button
                onClick={() => {/* Handle cart view */}}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
              >
                <ShoppingCartIcon className="w-4 h-4" />
                <span>Cart ({getCartItemCount()})</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {productsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading products..." />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products?.data?.map((product) => {
            const cartItem = cart.find(item => item.productId === product._id);
            const canAfford = (points?.availablePoints || 0) >= product.pointsCost;
            
            return (
              <div key={product._id} className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
                <div className="aspect-w-16 aspect-h-9">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      const target = e.target;
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA2MEgxNDBWMTQwSDYwVjYwWiIgZmlsbD0iI0Q1RDVENSIvPgo8L3N2Zz4K';
                    }}
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-blue-900 line-clamp-2">
                      {product.name}
                    </h3>
                    <div className="flex items-center space-x-1 ml-2">
                      {[...Array(5)].map((_, i) => (
                        <StarIcon
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating)
                              ? 'text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="text-xs text-gray-600 ml-1">
                        ({product.rating})
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-blue-900">
                        {product.pointsCost} pts
                      </span>
                      <span className="text-xs text-gray-500">
                        Stock: {product.inventory}
                      </span>
                    </div>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {product.category}
                    </span>
                  </div>
                  
                  {cartItem ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateCartQuantity(product._id, cartItem.quantity - 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                        >
                          -
                        </button>
                        <span className="font-medium">{cartItem.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(product._id, cartItem.quantity + 1)}
                          className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                          disabled={cartItem.quantity >= product.inventory}
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(product._id)}
                        className="text-red-600 text-sm hover:text-red-800"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product._id)}
                      disabled={!canAfford || product.inventory === 0}
                      className={`w-full py-2 rounded-md font-medium transition-colors ${
                        canAfford && product.inventory > 0
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {product.inventory === 0
                        ? 'Out of Stock'
                        : !canAfford
                        ? 'Not Enough Points'
                        : 'Add to Cart'
                      }
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {products?.data?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No products found matching your criteria.</p>
        </div>
      )}

      {/* Cart Summary & Checkout */}
      {cart.length > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-blue-100 p-4 max-w-sm">
          <h3 className="font-semibold text-blue-900 mb-2">Cart Summary</h3>
          <div className="space-y-2 mb-4">
            {cart.map((item) => {
              const product = products?.data?.find((p) => p._id === item.productId);
              return (
                <div key={item.productId} className="flex justify-between text-sm">
                  <span>{product?.name} x{item.quantity}</span>
                  <span>{(product?.pointsCost || 0) * item.quantity} pts</span>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-2 mb-4">
            <div className="flex justify-between font-semibold">
              <span>Total:</span>
              <span>{getCartTotal()} pts</span>
            </div>
          </div>
          <button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending || getCartTotal() > (points?.availablePoints || 0)}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {purchaseMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <ShoppingCartIcon className="w-4 h-4" />
                <span>Purchase</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
