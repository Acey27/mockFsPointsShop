import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { useEventDrivenRefresh } from '../hooks/useUnifiedAutoRefresh';
import {
  ShoppingCartIcon,
  StarIcon,
  ChartBarIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  MinusIcon,
  XMarkIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

const ShopPage= () => {
  const { points, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showCart, setShowCart] = useState(false);
  const [selectedItems, setSelectedItems] = useState(new Set());
  const { triggerPurchaseRefresh } = useEventDrivenRefresh();

  // Auto-refresh is now handled globally

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products', { search: searchTerm, category: selectedCategory }],
    queryFn: () => apiClient.getProducts({ 
      search: searchTerm || undefined, 
      category: selectedCategory || undefined 
    }),
  });

  // Fetch cart from database
  const { data: cart, isLoading: cartLoading, refetch: refetchCart, error: cartError } = useQuery({
    queryKey: ['cart'],
    queryFn: () => apiClient.getCart(),
    staleTime: 0,
  });

  // Add to cart mutation
  const addToCartMutation = useMutation({
    mutationFn: ({ productId, quantity }) => apiClient.addToCart(productId, quantity),
    onSuccess: () => {
      refetchCart();
    },
    onError: (error) => {
      alert(error.message || 'Failed to add to cart');
    }
  });

  // Update cart mutation
  const updateCartMutation = useMutation({
    mutationFn: ({ productId, quantity }) => apiClient.updateCartItem(productId, quantity),
    onSuccess: () => {
      refetchCart();
    },
    onError: (error) => {
      alert(error.message || 'Failed to update cart');
    }
  });

  // Remove from cart mutation
  const removeFromCartMutation = useMutation({
    mutationFn: (productId) => apiClient.removeFromCart(productId),
    onSuccess: () => {
      refetchCart();
    },
    onError: (error) => {
      alert(error.message || 'Failed to remove from cart');
    }
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
      // Trigger event-driven refresh after purchase (this will handle auth refresh)
      triggerPurchaseRefresh();
      
      // Update points in auth context immediately for instant UI feedback
      if (data.newBalance !== undefined) {
        // Create updated points object
        const updatedPoints = {
          ...points,
          availablePoints: data.newBalance,
          totalSpent: (points?.totalSpent || 0) + data.receipt.summary.total,
          lastTransactionAt: new Date().toISOString()
        };
        // Update context immediately
        queryClient.setQueryData(['currentUser'], (oldData) => {
          if (oldData) {
            return {
              ...oldData,
              points: updatedPoints
            };
          }
          return oldData;
        });
      }
      
      // Refresh cart (it should be empty after successful checkout)
      refetchCart();
      setSelectedItems(new Set());
      
      // Navigate to purchase success page with purchase data
      navigate('/purchase-success', { 
        state: {
          order: data.order,
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
    const product = products?.data?.find((p) => p._id === productId);
    if (!product) return;

    // Check if item already exists in cart
    const existingItem = cart?.data?.items?.find(item => item.productId?._id === productId);
    
    if (existingItem) {
      // Update quantity if item already exists
      updateCartMutation.mutate({ productId, quantity: existingItem.quantity + 1 });
    } else {
      // Add new item to cart
      addToCartMutation.mutate({ productId, quantity: 1 });
      // Auto-select new items when added to cart
      setSelectedItems(prevSelected => new Set([...prevSelected, productId]));
    }
  };

  const removeFromCart = (productId) => {
    removeFromCartMutation.mutate(productId);
    // Remove from selected items when removed from cart
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      newSelected.delete(productId);
      return newSelected;
    });
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    updateCartMutation.mutate({ productId, quantity });
  };

  const toggleItemSelection = (productId) => {
    setSelectedItems(prevSelected => {
      const newSelected = new Set(prevSelected);
      if (newSelected.has(productId)) {
        newSelected.delete(productId);
      } else {
        newSelected.add(productId);
      }
      return newSelected;
    });
  };

  const selectAllItems = () => {
    setSelectedItems(new Set(cart?.data?.items?.map(item => item.productId?._id).filter(Boolean) || []));
  };

  const deselectAllItems = () => {
    setSelectedItems(new Set());
  };

  const getCartTotal = () => {
    return cart?.data?.items?.reduce((total, item) => {
      return total + (item.productId?.pointsCost || 0) * item.quantity;
    }, 0) || 0;
  };

  const getSelectedTotal = () => {
    return cart?.data?.items?.reduce((total, item) => {
      if (selectedItems.has(item.productId?._id)) {
        return total + (item.productId?.pointsCost || 0) * item.quantity;
      }
      return total;
    }, 0) || 0;
  };

  const getSelectedItemCount = () => {
    return cart?.data?.items?.reduce((total, item) => {
      if (selectedItems.has(item.productId?._id)) {
        return total + item.quantity;
      }
      return total;
    }, 0) || 0;
  };

  const getCartItemCount = () => {
    return cart?.data?.items?.reduce((total, item) => total + item.quantity, 0) || 0;
  };

  const clearCart = () => {
    apiClient.clearCart().then(() => {
      refetchCart();
      setSelectedItems(new Set());
      setShowCart(false);
    });
  };

  const handlePurchase = () => {
    const selectedCartItems = cart?.data?.items?.filter(item => selectedItems.has(item.productId?._id)) || [];
    
    if (selectedCartItems.length > 0) {
      const total = getSelectedTotal();
      if (total > (points?.availablePoints || 0)) {
        alert(`Insufficient points! You need ${total} points but only have ${points?.availablePoints || 0}.`);
        return;
      }
      
      // Convert cart items to purchase format
      const purchaseItems = selectedCartItems.map(item => ({
        productId: item.productId?._id,
        quantity: item.quantity,
        pointsCostPerItem: item.productId?.pointsCost
      }));
      
      purchaseMutation.mutate({ items: purchaseItems });
      setShowCart(false);
    } else {
      alert('Please select at least one item to purchase.');
    }
  };

  const categories = Array.from(new Set(products?.data?.map((p) => p.category) || []))
    .filter(Boolean)
    .sort();

  // Filter products client-side as backup to server-side filtering
  const filteredProducts = products?.data?.filter(product => {
    const matchesSearch = !searchTerm || 
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }) || [];

  // Show loading if either products or cart is loading
  if (productsLoading || cartLoading) {
    return <LoadingSpinner />;
  }

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
                {points?.availablePoints || 0} points available
              </span>
            </div>
          </div>
          {getCartItemCount() > 0 && (
            <div className="relative">
              <button
                onClick={() => {
                  // Scroll to cart panel
                  const cartPanel = document.getElementById('cart-panel');
                  if (cartPanel) {
                    cartPanel.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 relative"
              >
                <ShoppingCartIcon className="w-4 h-4" />
                <span>Cart ({getCartItemCount()})</span>
                {getCartItemCount() > 0 && (
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {getCartItemCount()}
                  </span>
                )}
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
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Enhanced Cart Panel */}
      {getCartItemCount() > 0 && (
        <div id="cart-panel" className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200 shadow-sm">
          {/* Cart Header */}
          <div className="px-6 py-4 border-b border-blue-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-blue-100 p-2 rounded-lg">
                  <ShoppingCartIcon className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Shopping Cart ({getCartItemCount()} items)
                  </h3>
                  <p className="text-sm text-blue-600">
                    Selected: {getSelectedItemCount()} items ({getSelectedTotal()} points) | Total: {getCartTotal()} points
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={selectedItems.size === cart.length ? deselectAllItems : selectAllItems}
                  className="text-green-600 hover:text-green-800 font-medium text-sm"
                >
                  {selectedItems.size === cart.length ? 'Deselect All' : 'Select All'}
                </button>
                <button
                  onClick={clearCart}
                  className="text-red-600 hover:text-red-800 font-medium text-sm"
                >
                  Clear All
                </button>
              </div>
            </div>
          </div>

          {/* Cart Items - Always show when cart has items */}
          <div className="px-6 py-4">
            <div className="space-y-3 mb-4">
              {cart?.data?.items?.map((item) => (
                <div key={item.productId?._id} className={`flex items-center justify-between p-4 rounded-lg border transition-all ${
                  selectedItems.has(item.productId?._id) 
                    ? 'bg-blue-50 border-blue-300 shadow-sm' 
                    : 'bg-white border-gray-200'
                }`}>
                  <div className="flex items-center space-x-4">
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.productId?._id)}
                      onChange={() => toggleItemSelection(item.productId?._id)}
                      className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                    />
                    <img
                      src={item.productId?.image || 'https://via.placeholder.com/48x48?text=Product'}
                      alt={item.productId?.name || 'Product'}
                      className="w-12 h-12 object-cover rounded-md"
                    />
                    <div>
                      <h4 className="font-medium text-gray-900">{item.productId?.name || 'Loading...'}</h4>
                      <p className="text-sm text-gray-600">{item.productId?.pointsCost || 0} points each</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
                      <button
                        onClick={() => updateCartQuantity(item.productId?._id, item.quantity - 1)}
                        className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <MinusIcon className="w-4 h-4 text-gray-600" />
                      </button>
                      <span className="w-8 text-center font-medium text-gray-900">{item.quantity}</span>
                      <button
                        onClick={() => updateCartQuantity(item.productId?._id, item.quantity + 1)}
                        className="p-1 rounded-md hover:bg-gray-200 transition-colors"
                      >
                        <PlusIcon className="w-4 h-4 text-gray-600" />
                      </button>
                    </div>
                    <div className="text-right min-w-[80px]">
                      <p className="font-semibold text-gray-900">{(item.productId?.pointsCost || 0) * item.quantity} pts</p>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.productId?._id)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Cart Summary and Actions */}
            <div className="border-t border-blue-200 pt-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col space-y-1">
                  <div className="text-lg font-semibold text-blue-900">
                    Selected: {getSelectedTotal()} points ({getSelectedItemCount()} items)
                  </div>
                  <div className="text-sm text-gray-600">
                    Available: {points?.availablePoints || 0} points | Cart Total: {getCartTotal()} points
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  {getSelectedTotal() > (points?.availablePoints || 0) && (
                    <div className="bg-red-50 text-red-700 px-3 py-1 rounded-md text-sm">
                      Insufficient points! Need {getSelectedTotal() - (points?.availablePoints || 0)} more.
                    </div>
                  )}
                  {selectedItems.size === 0 && (
                    <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-md text-sm">
                      Select items to purchase
                    </div>
                  )}
                  <button
                    onClick={handlePurchase}
                    disabled={purchaseMutation.isPending || getSelectedTotal() > (points?.availablePoints || 0) || selectedItems.size === 0}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition-colors"
                  >
                    {purchaseMutation.isPending ? (
                      <LoadingSpinner size="sm" />
                    ) : (
                      <>
                        <CheckCircleIcon className="w-4 h-4" />
                        <span>Purchase Selected ({getSelectedTotal()} pts)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      {productsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading products..." />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts?.map((product) => {
            const cartItem = cart?.data?.items?.find(item => item.productId?._id === product._id);
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
                    <div className="space-y-2">
                      {!canAfford && (
                        <div className="text-xs text-red-600 text-center bg-red-50 px-2 py-1 rounded">
                          Need {product.pointsCost - (points?.availablePoints || 0)} more points
                        </div>
                      )}
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
                    </div>
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
      {getCartItemCount() > 0 && (
        <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg border border-blue-100 p-4 max-w-sm">
          <h3 className="font-semibold text-blue-900 mb-2">Cart Summary</h3>
          <div className="space-y-2 mb-4">
            {cart?.data?.items?.map((item) => {
              const isSelected = selectedItems.has(item.productId?._id);
              return (
                <div key={item.productId?._id} className={`flex justify-between text-sm ${isSelected ? 'text-blue-900 font-medium' : 'text-gray-500'}`}>
                  <span className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleItemSelection(item.productId?._id)}
                      className="w-3 h-3 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-1"
                    />
                    <span>{item.productId?.name} x{item.quantity}</span>
                  </span>
                  <span>{(item.productId?.pointsCost || 0) * item.quantity} pts</span>
                </div>
              );
            })}
          </div>
          <div className="border-t pt-2 mb-4">
            <div className="flex justify-between font-semibold mb-1">
              <span>Selected:</span>
              <span className="text-blue-600">{getSelectedTotal()} pts</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Cart Total:</span>
              <span>{getCartTotal()} pts</span>
            </div>
          </div>
          <button
            onClick={handlePurchase}
            disabled={purchaseMutation.isPending || getSelectedTotal() > (points?.availablePoints || 0) || selectedItems.size === 0}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {purchaseMutation.isPending ? (
              <LoadingSpinner size="sm" />
            ) : (
              <>
                <ShoppingCartIcon className="w-4 h-4" />
                <span>Purchase Selected</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ShopPage;
