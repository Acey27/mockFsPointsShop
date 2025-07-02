import React from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';

interface DeleteConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isLoading: boolean;
  title: string;
  message: string;
  itemName?: string;
}

const DeleteConfirmation: React.FC<DeleteConfirmationProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  title,
  message,
  itemName
}) => {
  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      await onConfirm();
      onClose();
    } catch (error) {
      console.error('Error during confirmation:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-4">
            {message}
          </p>
          {itemName && (
            <div className="bg-gray-50 rounded-md p-3 mb-4">
              <p className="text-sm font-medium text-gray-900">
                Item: <span className="font-normal">{itemName}</span>
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            This action cannot be undone.
          </p>
        </div>

        <div className="flex space-x-3 p-6 bg-gray-50 rounded-b-lg">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
