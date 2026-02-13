import { FaTimes } from 'react-icons/fa';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-2xl',
    lg: 'max-w-4xl',
    xl: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div
          className="fixed inset-0 bg-black/60 transition-opacity"
          onClick={onClose}
          aria-hidden
        />

        <div
          className={`relative inline-block w-full ${sizeClasses[size]} bg-[#1C1F4A] rounded-xl border border-[#2D3748] shadow-xl text-left overflow-hidden`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[#2D3748]">
            <h3 id="modal-title" className="text-base sm:text-lg font-medium text-white">
              {title}
            </h3>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-lg text-[#9CA3AF] hover:bg-[#2D3748] hover:text-white transition-colors"
              aria-label="Close"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>

          <div className="px-4 sm:px-6 py-4 max-h-[calc(100vh-12rem)] overflow-y-auto">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
