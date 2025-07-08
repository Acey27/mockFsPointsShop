import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api';
import { useEventDrivenRefresh } from '../hooks/useUnifiedAutoRefresh';
// Types are now documented as JSDoc in ../types/index.js
import ProductForm from './ProductForm';
import DeleteConfirmation from './DeleteConfirmation';
import LoadingSpinner from './LoadingSpinner';
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  CubeIcon
} from '@heroicons/react/24/outline';

/**
 * ProductManagement component props
 * @param {Object} props
 * @param {string} [props.className] - Additional CSS classes
 */

const PRODUCT_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'giftcards', label: 'Gift Cards' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'books', label: 'Books' },
];

const ProductManagement= ({ className = '' }) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [viewMode, setViewMode] = useState('grid');

  const queryClient = useQueryClient();
  const { triggerProductManagementRefresh } = useEventDrivenRefresh();

  // Fetch products
  const { data: productsData, isLoading: productsLoading, error } = useQuery({
    queryKey: ['admin-products', searchTerm, categoryFilter, statusFilter],
    queryFn: () => {
      const params = {};
      if (searchTerm) params.search = searchTerm;
      if (categoryFilter !== 'all') params.category = categoryFilter;
      if (statusFilter !== 'all') params.includeInactive = statusFilter === 'inactive';
      
      return apiClient.getAdminProducts(params);
    },
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data) => apiClient.createProduct(data),
    onSuccess: () => {
      triggerProductManagementRefresh();
      setIsFormOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      console.error('Error creating product:', error);
    },
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }) => 
      apiClient.updateProduct(id, data),
    onSuccess: () => {
      triggerProductManagementRefresh();
      setIsFormOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      console.error('Error updating product:', error);
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id) => apiClient.deleteProduct(id),
    onSuccess: () => {
      triggerProductManagementRefresh();
      setIsDeleteOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      console.error('Error deleting product:', error);
    },
  });

  const products = productsData?.data || [];

  const handleCreateProduct = () => {
    setSelectedProduct(null);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (product) => {
    setSelectedProduct(product);
    setIsDeleteOpen(true);
  };

  const handleFormSubmit = async (productData) => {
    if (selectedProduct) {
      await updateProductMutation.mutateAsync({
        id: selectedProduct._id,
        data: productData
      });
    } else {
      await createProductMutation.mutateAsync(productData);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedProduct) {
      await deleteProductMutation.mutateAsync(selectedProduct._id);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && product.isActive) ||
                         (statusFilter === 'inactive' && !product.isActive);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStatusColor = (isActive) => {
    return isActive 
      ? 'bg-green-100 text-green-800' 
      : 'bg-red-100 text-red-800';
  };

  const getCategoryLabel = (category) => {
    const cat = PRODUCT_CATEGORIES.find(c => c.value === category);
    return cat ? cat.label : category;
  };

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error loading products. Please try again.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h3 className="text-xl font-semibold text-blue-900">Product Management</h3>
          <p className="text-sm text-gray-600">
            Manage your store's product catalog
          </p>
        </div>
        <button
          onClick={handleCreateProduct}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Filters and Search */}
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
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {PRODUCT_CATEGORIES.map(cat => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div className="flex border border-gray-300 rounded-md">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-2 text-sm font-medium rounded-l-md ${
                viewMode === 'grid' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-2 text-sm font-medium rounded-r-md border-l ${
                viewMode === 'table' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              Table
            </button>
          </div>
        </div>
      </div>

      {/* Products Display */}
      {productsLoading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" text="Loading products..." />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-12 text-center">
          <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-500 mb-6">
            {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all' 
              ? 'Try adjusting your search filters.' 
              : 'Get started by adding your first product.'}
          </p>
          {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
            <button
              onClick={handleCreateProduct}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Add Your First Product
            </button>
          )}
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((product) => (
            <div key={product._id} className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden hover:shadow-md transition-shadow">
              <div className="relative">
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-48 object-cover"
                  onError={(e) => {
                    const target = e.target;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik02MCA2MEgxNDBWMTQwSDYwVjYwWiIgZmlsbD0iI0Q1RDVENSIvPgo8L3N2Zz4K';
                  }}
                />
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.isActive)}`}>
                    {product.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
              <div className="p-4">
                <h4 className="font-semibold text-gray-900 mb-2 line-clamp-1">{product.name}</h4>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{product.description}</p>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-blue-900">{product.pointsCost} pts</span>
                  <span className="text-sm text-gray-500">Stock: {product.inventory}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                    {getCategoryLabel(product.category)}
                  </span>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="text-blue-600 hover:text-blue-900 p-1"
                      title="Edit Product"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product)}
                      className="text-red-600 hover:text-red-900 p-1"
                      title="Delete Product"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Inventory
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredProducts.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 flex-shrink-0">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md"
                            onError={(e) => {
                              const target = e.target;
                              target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xNCAxNEgyOFYyOEgxNFYxNFoiIGZpbGw9IiNENUQ1RDUiLz4KPC9zdmc+Cg==';
                            }}
                          />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          <div className="text-sm text-gray-500 max-w-xs truncate">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {getCategoryLabel(product.category)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-900">
                      {product.pointsCost}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {product.inventory}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(product.isActive)}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => handleEditProduct(product)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Product"
                      >
                        <PencilIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(product)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Product"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <div className="text-2xl font-bold text-blue-900">{filteredProducts.length}</div>
          <div className="text-sm text-gray-600">Total Products</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <div className="text-2xl font-bold text-green-900">
            {filteredProducts.filter((p) => p.isActive).length}
          </div>
          <div className="text-sm text-gray-600">Active Products</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <div className="text-2xl font-bold text-orange-900">
            {filteredProducts.filter((p) => p.inventory < 10).length}
          </div>
          <div className="text-sm text-gray-600">Low Stock</div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-blue-100">
          <div className="text-2xl font-bold text-purple-900">
            {[...new Set(filteredProducts.map((p) => p.category))].length}
          </div>
          <div className="text-sm text-gray-600">Categories</div>
        </div>
      </div>

      {/* Product Form Modal */}
      <ProductForm
        product={selectedProduct}
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedProduct(null);
        }}
        onSubmit={handleFormSubmit}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmation
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setSelectedProduct(null);
        }}
        onConfirm={handleDeleteConfirm}
        isLoading={deleteProductMutation.isPending}
        title="Delete Product"
        message="Are you sure you want to delete this product? This will deactivate it and it will no longer be available for purchase."
        itemName={selectedProduct?.name}
      />
    </div>
  );
};

export default ProductManagement;
