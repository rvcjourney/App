// import { FaTimes } from 'react-icons/fa';
// import '../App.css';

// const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
//   if (!isOpen) return null;

//   const sizeClasses = {
//     sm: 'max-w-md',
//     md: 'max-w-2xl',
//     lg: 'max-w-4xl',
//     xl: 'max-w-6xl',
//   };

//   return (
//     // <div className="fixed inset-0 z-50 overflow-y-auto lp-fade-in">
//     <div className="modal show d-block my-3" tabIndex="-1"  role="dialog" aria-modal="true">
//       <div className="flex items-center justify-center min-h-screen p-4">
//         <div
//           // className="fixed inset-0 bg-black/60 transition-opacity lp-fade-in"
//           onClick={onClose}
//           aria-hidden
//         />

//         <div
//           className={`relative inline-block w-full ${sizeClasses[size]} bg-[#1C1F4A] rounded-xl border border-[#2D3748] shadow-xl text-left overflow-hidden lp-scale-in`}
//           role="dialog"
//           aria-modal="true"
//           aria-labelledby="modal-title"
//         >
//           <div className="flex items-center justify-between p-3 border-b border-[#2D3748] bg-gradient-to-r from-[#1C1F4A] to-[#1a1c42]">
//             <h3 id="modal-title" className="text-sm sm:text-xl font-bold text-white">
//               {title}
//             </h3>
//             <button
//               type="button"
//               onClick={onClose}
//               className="p-1 ml-4 text-[#9CA3AF] hover:bg-[#2D3748] hover:text-white rounded-lg transition-all duration-200"
//               aria-label="Close"
//             >
//               <FaTimes className="w-5 h-5" aria-hidden />
//             </button>
//           </div>

//           <div className="px-5 py-4 max-h-[calc(100vh-10rem)] overflow-y-auto">
//             {children}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default Modal;


// ============================
import { FaTimes } from 'react-icons/fa';
import '../App.css';

const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeMap = {
    sm: 'modal-sm',
    md: '',
    lg: 'modal-lg',
    xl: 'modal-xl',
  };

  return (
    <>
      {/* Backdrop */}
      <div className="modal-backdrop fade show"></div>

      {/* Modal */}
      <div className="modal fade show d-block" tabIndex="-1" role="dialog">
        <div className={`modal-dialog modal-dialog-centered ${sizeMap[size]}`} role="document">
          <div className="modal-content bg-dark text-white border border-secondary">

            {/* Header */}
            <div className="modal-header border-secondary justify-content-between">
              <h5 className="modal-title">{title}</h5>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={onClose}>
                <FaTimes />
              </button>
            </div>

            {/* Body */}
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {children}
            </div>

          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;



