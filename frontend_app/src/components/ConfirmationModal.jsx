import React from 'react';
import { AlertCircle, X } from 'lucide-react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', confirmStyle = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-in fade-in duration-200">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 overflow-hidden border border-gray-200 transform scale-100 transition-transform">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-lg font-bold text-gray-800 flex items-center">
            {confirmStyle === 'danger' && <AlertCircle className="text-red-500 mr-2" size={20} />}
            {title}
          </h3>
          <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-600">
            {message}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-white border border-gray-300 rounded text-gray-700 hover:bg-gray-50 font-medium text-sm"
          >
            Cancel
          </button>
          <button 
            onClick={onConfirm}
            className={`px-4 py-2 rounded text-white font-bold text-sm shadow-sm ${
              confirmStyle === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-aws-blue hover:bg-[#232f3e]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
