import React from 'react';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', type = 'info' }) => {
  if (!isOpen) return null;

  const isDanger = type === 'danger';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 animate-fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden transform transition-all scale-100">
        
        {/* Header */}
        <div className={`px-6 py-4 border-b ${isDanger ? 'bg-red-50 border-red-100' : 'bg-gray-50 border-gray-100'}`}>
            <h3 className={`text-lg font-bold ${isDanger ? 'text-red-700' : 'text-gray-800'}`}>
                {title}
            </h3>
        </div>

        {/* Body */}
        <div className="p-6">
            <p className="text-gray-600 leading-relaxed">
                {message}
            </p>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t flex justify-end space-x-3">
            <button 
                onClick={onCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-aws-blue"
            >
                Cancel
            </button>
            <button 
                onClick={onConfirm}
                className={`px-4 py-2 text-sm font-bold text-white rounded focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    isDanger 
                    ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                    : 'bg-aws-orange hover:bg-orange-600 focus:ring-orange-500'
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
