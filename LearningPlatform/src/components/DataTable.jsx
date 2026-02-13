import { useState } from 'react';
import { FaEdit, FaTrash, FaHistory, FaEye, FaChevronLeft, FaChevronRight, FaWallet } from 'react-icons/fa';

const DataTable = ({
  data,
  columns,
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

  const filteredData = data.filter((item) =>
    columns.some((col) => {
      const value = col.accessor(item);
      return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
    })
  );

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handlePageChange = (page) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[16rem]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#5568FE] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl overflow-hidden">
      <div className="p-3 sm:p-4 border-b border-[#2D3748]">
        <input
          type="text"
          placeholder="Search..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="w-full px-3 py-2 sm:px-4 sm:py-2.5 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE] focus:border-transparent"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2D3748]">
          <thead className="bg-[#0B0D2A]">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap"
                >
                  {col.header}
                </th>
              ))}
              <th className="px-3 py-3 sm:px-6 sm:py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider whitespace-nowrap">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D3748]">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="px-3 py-8 sm:px-6 text-center text-[#9CA3AF] text-sm"
                >
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[#0B0D2A]/50 transition-colors">
                  {columns.map((col, colIdx) => (
                    <td
                      key={colIdx}
                      className="px-3 py-3 sm:px-6 sm:py-4 text-sm text-white whitespace-nowrap"
                    >
                      {col.accessor(row)}
                    </td>
                  ))}
                  <td className="px-3 py-3 sm:px-6 sm:py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1 sm:gap-2">
                      {onPreview && (
                        <button
                          type="button"
                          onClick={() => onPreview(row)}
                          className="p-2 rounded-lg text-[#5568FE] hover:bg-[#5568FE]/20 transition-colors"
                          title="Preview"
                        >
                          <FaEye className="w-4 h-4" />
                        </button>
                      )}
                      {onWallet && (
                        <button
                          type="button"
                          onClick={() => onWallet(row)}
                          className="p-2 rounded-lg text-amber-400 hover:bg-amber-400/20 transition-colors"
                          title="Wallet"
                        >
                          <FaWallet className="w-4 h-4" />
                        </button>
                      )}
                      {onUpdate && (
                        <button
                          type="button"
                          onClick={() => onUpdate(row)}
                          className="p-2 rounded-lg text-[#34D399] hover:bg-[#34D399]/20 transition-colors"
                          title="Update"
                        >
                          <FaEdit className="w-4 h-4" />
                        </button>
                      )}
                      {onAudit && (
                        <button
                          type="button"
                          onClick={() => onAudit(row)}
                          className="p-2 rounded-lg text-[#5568FE] hover:bg-[#5568FE]/20 transition-colors"
                          title="Audit"
                        >
                          <FaHistory className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(row)}
                          className="p-2 rounded-lg text-[#F87171] hover:bg-[#F87171]/20 transition-colors"
                          title="Delete"
                        >
                          <FaTrash className="w-4 h-4" />
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

      {totalPages > 1 && (
        <div className="px-3 py-3 sm:px-4 sm:py-3 border-t border-[#2D3748] flex flex-col xs:flex-row items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-[#9CA3AF] order-2 xs:order-1">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredData.length)} of{' '}
            {filteredData.length} entries
          </div>
          <div className="flex items-center gap-2 order-1 xs:order-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-[#2D3748] text-[#9CA3AF] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D3748] hover:text-white transition-colors"
            >
              <FaChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs sm:text-sm text-[#9CA3AF] min-w-[6rem] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-[#2D3748] text-[#9CA3AF] disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#2D3748] hover:text-white transition-colors"
            >
              <FaChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DataTable;
