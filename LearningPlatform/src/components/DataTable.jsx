// import { useState } from 'react';
// import { FaEdit, FaTrash, FaHistory, FaEye, FaChevronLeft, FaChevronRight, FaWallet } from 'react-icons/fa';

// const DataTable = ({
//   data,
//   columns,
//   onUpdate,
//   onDelete,
//   onAudit,
//   onPreview,
//   onWallet,
//   loading = false,
// }) => {
//   const [currentPage, setCurrentPage] = useState(1);
//   const [searchTerm, setSearchTerm] = useState('');
//   const itemsPerPage = 10;

//   const filteredData = data.filter((item) =>
//     columns.some((col) => {
//       const value = col.accessor(item);
//       return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
//     })
//   );

//   const totalPages = Math.ceil(filteredData.length / itemsPerPage);
//   const startIndex = (currentPage - 1) * itemsPerPage;
//   const endIndex = startIndex + itemsPerPage;
//   const paginatedData = filteredData.slice(startIndex, endIndex);

//   const handlePageChange = (page) => {
//     setCurrentPage(Math.max(1, Math.min(page, totalPages)));
//   };

//   if (loading) {
//     return (
//       <div className="flex justify-center items-center min-h-[16rem]">
//         <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#5568FE] border-t-transparent" />
//       </div>
//     );
//   }

//   return (
//     <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl overflow-hidden shadow-lg">
//       <div className="p-4 sm:p-5 lg:p-6 border-b border-[#2D3748]">
//         <input
//           type="text"
//           placeholder="Search..."
//           value={searchTerm}
//           onChange={(e) => {
//             setSearchTerm(e.target.value);
//             setCurrentPage(1);
//           }}
//           className="px-4 py-2 w-full sm:w-1/2 md:w-1/3 lg:w-1/4 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-sm text-white focus:outline-none focus:ring-2 focus:ring-[#5568FE] focus:border-transparent transition-colors"
//         />
//       </div>

//       <div className="overflow-x-auto">
//         <table className="min-w-full divide-y divide-[#2D3748]">
//           <thead className="bg-[#0B0D2A]">
//             <tr>
//               {columns.map((col, idx) => (
//                 <th
//                   key={idx}
//                   className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
//                 >
//                   {col.header}
//                 </th>
//               ))}
//               <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">
//                 Actions
//               </th>
//             </tr>
//           </thead>
//           <tbody className="divide-y divide-[#2D3748]">
//             {paginatedData.length === 0 ? (
//               <tr>
//                 <td
//                   colSpan={columns.length + 1}
//                   className="px-3 py-8 sm:px-6 text-center text-[#9CA3AF] text-sm"
//                 >
//                   No data available
//                 </td>
//               </tr>
//             ) : (
//               paginatedData.map((row, rowIdx) => (
//                 <tr key={rowIdx} className="hover:bg-[#0B0D2A]/50 transition-colors table-row-anim">
//                   {columns.map((col, colIdx) => (
//                     <td
//                       key={colIdx}
//                       className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-white whitespace-normal break-words max-w-[12rem] sm:max-w-none"
//                     >
//                       {col.accessor(row)}
//                     </td>
//                   ))}
//                   <td className="px-3 py-3 sm:px-6 sm:py-4">
//                     <div className="flex items-center gap-1 sm:gap-2 flex-wrap">
//                       {onPreview && (
//                         <button
//                           type="button"
//                           onClick={() => onPreview(row)}
//                           className="icon-btn text-[#5568FE] hover:bg-[#5568FE]/20 transition-colors btn-animated"
//                           title="Preview"
//                         >
//                           <FaEye className="w-4 h-4" aria-hidden />
//                         </button>
//                       )}
//                       {onWallet && (
//                         <button
//                           type="button"
//                           onClick={() => onWallet(row)}
//                           className="icon-btn text-amber-400 hover:bg-amber-400/20 transition-colors btn-animated"
//                           title="Wallet"
//                         >
//                           <FaWallet className="w-4 h-4" aria-hidden />
//                         </button>
//                       )}
//                       {onUpdate && (
//                         <button
//                           type="button"
//                           onClick={() => onUpdate(row)}
//                           className="icon-btn text-[#34D399] hover:bg-[#34D399]/20 transition-colors btn-animated"
//                           title="Update"
//                         >
//                           <FaEdit className="w-4 h-4" aria-hidden />
//                         </button>
//                       )}
//                       {onAudit && (
//                         <button
//                           type="button"
//                           onClick={() => onAudit(row)}
//                           className="icon-btn text-[#5568FE] hover:bg-[#5568FE]/20 transition-colors btn-animated"
//                           title="Audit"
//                         >
//                           <FaHistory className="w-4 h-4" aria-hidden />
//                         </button>
//                       )}
//                       {onDelete && (
//                         <button
//                           type="button"
//                           onClick={() => onDelete(row)}
//                           className="icon-btn text-[#F87171] hover:bg-[#F87171]/20 transition-colors btn-animated"
//                           title="Delete"
//                         >
//                           <FaTrash className="w-4 h-4" aria-hidden />
//                         </button>
//                       )}
//                     </div>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       {totalPages > 1 && (
//         <div className="px-3 py-3 sm:px-4 sm:py-3 border-t border-[#2D3748] flex flex-col xs:flex-row items-center justify-between gap-3">
//           <div className="text-xs sm:text-sm text-[#9CA3AF] order-2 xs:order-1">
//             Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{' '}
//             {filteredData.length} entries
//           </div>
//           <div className="flex items-center gap-2 order-1 xs:order-2">
//             <button
//               type="button"
//               onClick={() => handlePageChange(currentPage - 1)}
//               disabled={currentPage === 1}
//               className="p-2 rounded-lg border border-[#2D3748] text-[#9CA3AF] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D3748] hover:text-white transition-colors"
//             >
//               <FaChevronLeft className="w-4 h-4" />
//             </button>
//             <span className="text-xs sm:text-sm text-[#9CA3AF] min-w-[6rem] text-center">
//               Page {currentPage} of {totalPages}
//             </span>
//             <button
//               type="button"
//               onClick={() => handlePageChange(currentPage + 1)}
//               disabled={currentPage === totalPages}
//               className="p-2 rounded-lg border border-[#2D3748] text-[#9CA3AF] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D3748] hover:text-white transition-colors"
//             >
//               <FaChevronRight className="w-4 h-4" />
//             </button>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// export default DataTable;

import { useState } from 'react';
import { FaEdit, FaTrash, FaHistory, FaEye, FaChevronLeft, FaChevronRight, FaWallet } from 'react-icons/fa';

const DataTable = ({
  data = [], // ✅ FIXED
  columns = [],
  onUpdate,
  onDelete,
  onAudit,
  onPreview,
  onWallet,
  loading = false,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 10;

  // 🔎 Search Filter
  const filteredData = data.filter((item) =>
    columns.some((col) => {
      const value = col.accessor(item);
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  // 📄 Pagination
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  // ⏳ Loading Spinner
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '250px' }}>
        <div className="spinner-border text-primary"></div>
      </div>
    );
  }

  return (
    <div className="card bg-dark text-white border-secondary shadow">

      {/* Search Bar */}
      <div className="card-header border-secondary bg-black">
        <input
          type="text"
          className="form-control w-50"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="table-responsive">
        <table className="table table-dark table-hover table-bordered align-middle mb-0">
          <thead className="table-secondary text-dark">
            <tr>
              {columns.map((col, idx) => (
                <th key={idx}>{col.header}</th>
              ))}
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="text-center text-muted py-4">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx}>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx}>{col.accessor(row)}</td>
                  ))}

                  {/* Actions */}
                  <td>
                    <div className="d-flex flex-wrap gap-2">

                      {onPreview && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => onPreview(row)}>
                          <FaEye />
                        </button>
                      )}

                      {onWallet && (
                        <button className="btn btn-sm btn-outline-warning" onClick={() => onWallet(row)}>
                          <FaWallet />
                        </button>
                      )}

                      {onUpdate && (
                        <button className="btn btn-sm btn-outline-success" onClick={() => onUpdate(row)}>
                          <FaEdit />
                        </button>
                      )}

                      {onAudit && (
                        <button className="btn btn-sm btn-outline-info" onClick={() => onAudit(row)}>
                          <FaHistory />
                        </button>
                      )}

                      {onDelete && (
                        <button className="btn btn-sm btn-outline-danger" onClick={() => onDelete(row)}>
                          <FaTrash />
                        </button>
                      )}

                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="card-footer d-flex justify-content-between align-items-center bg-black border-secondary">
          <small className="text-muted">
            Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredData.length)} of {filteredData.length}
          </small>

          <div className="d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-light"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
            >
              <FaChevronLeft />
            </button>

            <span className="text-white">
              Page {currentPage} of {totalPages}
            </span>

            <button
              className="btn btn-sm btn-outline-light"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
            >
              <FaChevronRight />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default DataTable;

