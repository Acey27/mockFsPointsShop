import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ProductFormProps {
  product?: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: Partial<Product>) => Promise<void>;
  isLoading: boolean;
}

const PRODUCT_CATEGORIES = [
  { value: 'apparel', label: 'Apparel' },
  { value: 'accessories', label: 'Accessories' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'office', label: 'Office Supplies' },
  { value: 'giftcards', label: 'Gift Cards' },
  { value: 'experiences', label: 'Experiences' },
  { value: 'food', label: 'Food & Beverages' },
  { value: 'books', label: 'Books' },
];

const ProductForm: React.FC<ProductFormProps> = ({
  product,
  isOpen,
  onClose,
  onSubmit,
  isLoading
}) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    pointsCost: '',
    category: 'apparel',
    image: '',
    inventory: '',
    isActive: true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Initialize form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        pointsCost: product.pointsCost?.toString() || '',
        category: product.category || 'apparel',
        image: product.image || '',
        inventory: product.inventory?.toString() || '',
        isActive: product.isActive !== false
      });
    } else {
      setFormData({
        name: '',
        description: '',
        pointsCost: '',
        category: 'apparel',
        image: '',
        inventory: '',
        isActive: true
      });
    }
    setErrors({});
  }, [product, isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Product name cannot exceed 100 characters';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length > 1000) {
      newErrors.description = 'Description cannot exceed 1000 characters';
    }

    if (!formData.pointsCost || isNaN(Number(formData.pointsCost)) || Number(formData.pointsCost) < 1) {
      newErrors.pointsCost = 'Points cost must be a positive number';
    }

    if (!formData.image.trim()) {
      newErrors.image = 'Image URL is required';
    } else if (!/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(formData.image)) {
      newErrors.image = 'Image must be a valid URL ending with jpg, jpeg, png, gif, or webp';
    }

    if (!formData.inventory || isNaN(Number(formData.inventory)) || Number(formData.inventory) < 0) {
      newErrors.inventory = 'Inventory must be a non-negative number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const productData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      pointsCost: Number(formData.pointsCost),
      category: formData.category,
      image: formData.image.trim(),
      inventory: Number(formData.inventory),
      isActive: formData.isActive
    };

    try {
      await onSubmit(productData);
      onClose();
    } catch (error) {
      console.error('Error submitting product:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Edit Product' : 'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                errors.name ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              disabled={isLoading}
              rows={4}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                errors.description ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter product description"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
          </div>

          {/* Points Cost and Category Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pointsCost" className="block text-sm font-medium text-gray-700 mb-1">
                Points Cost *
              </label>
              <input
                type="number"
                id="pointsCost"
                name="pointsCost"
                value={formData.pointsCost}
                onChange={handleChange}
                disabled={isLoading}
                min="1"
                step="1"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                  errors.pointsCost ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter points cost"
              />
              {errors.pointsCost && <p className="mt-1 text-sm text-red-600">{errors.pointsCost}</p>}
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category *
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                disabled={isLoading}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {PRODUCT_CATEGORIES.map(cat => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Image URL */}
          <div>
            <label htmlFor="image" className="block text-sm font-medium text-gray-700 mb-1">
              Image URL *
            </label>
            <input
              type="url"
              id="image"
              name="image"
              value={formData.image}
              onChange={handleChange}
              disabled={isLoading}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                errors.image ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="https://example.com/image.jpg"
            />
            {errors.image && <p className="mt-1 text-sm text-red-600">{errors.image}</p>}
            {formData.image && !errors.image && (
              <div className="mt-2">
                <img
                  src={formData.image}
                  alt="Preview"
                  className="w-32 h-32 object-cover rounded-md border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                  }}
                />
              </div>
            )}
          </div>

          {/* Inventory and Status Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="inventory" className="block text-sm font-medium text-gray-700 mb-1">
                Inventory *
              </label>
              <input
                type="number"
                id="inventory"
                name="inventory"
                value={formData.inventory}
                onChange={handleChange}
                disabled={isLoading}
                min="0"
                step="1"
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 ${
                  errors.inventory ? 'border-red-300 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter inventory count"
              />
              {errors.inventory && <p className="mt-1 text-sm text-red-600">{errors.inventory}</p>}
            </div>

            <div className="flex items-center pt-6">
              <input
                type="checkbox"
                id="isActive"
                name="isActive"
                checked={formData.isActive}
                onChange={handleChange}
                disabled={isLoading}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
              />
              <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                Product is active
              </label>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex space-x-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : product ? 'Update Product' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;
