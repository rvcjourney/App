# 🎨 UI Improvements - Implementation Guide

## 1. Toast Notification System

### Installation
```bash
npm install react-toastify
```

### Usage Example
```javascript
// src/hooks/useNotification.js
import { toast } from 'react-toastify';

export const useNotification = () => {
  const showSuccess = (message) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
  };

  const showError = (message) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: 3000,
    });
  };

  const showInfo = (message) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 2000,
    });
  };

  return { showSuccess, showError, showInfo };
};
```

### In App.jsx
```javascript
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
  return (
    <Router>
      <ToastContainer />
      {/* Rest of app */}
    </Router>
  );
}
```

---

## 2. Enhanced DataTable with Export Features

```javascript
// src/components/DataTable.jsx - Enhanced Version

import { useState } from 'react';
import { FaEdit, FaTrash, FaEye, FaHistory, FaWallet, FaDownload, FaFilter } from 'react-icons/fa';

const DataTable = ({
  data,
  columns,
  onUpdate,
  onDelete,
  onAudit,
  onPreview,
  onWallet,
  loading = false,
  title = "Data Table",
  onExport,
  filters = [],
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const itemsPerPage = 10;

  // Sorting function
  const handleSort = (columnKey) => {
    setSortConfig({
      key: columnKey,
      direction: sortConfig.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  // Export to CSV
  const handleExport = () => {
    const headers = columns.map((col) => col.header).join(',');
    const rows = filteredData.map((item) =>
      columns.map((col) => col.accessor(item)).join(',')
    );
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title}-${new Date().toISOString()}.csv`;
    a.click();
  };

  // Filter and sort data
  const filteredData = data
    .filter((item) =>
      columns.some((col) =>
        col.accessor(item)?.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      const aVal = columns
        .find((col) => col.header === sortConfig.key)
        ?.accessor(a);
      const bVal = columns
        .find((col) => col.header === sortConfig.key)
        ?.accessor(b);
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[16rem]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#5568FE] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl overflow-hidden">
      {/* Header with search and export */}
      <div className="p-4 border-b border-[#2D3748] space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-center">
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="flex-1 px-4 py-2 bg-[#0B0D2A] border border-[#2D3748] rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE]"
          />
          {onExport && (
            <button
              onClick={handleExport}
              className="flex items-center gap-2 px-4 py-2 bg-[#5568FE] text-white rounded-lg hover:bg-[#4455DD] transition-colors"
            >
              <FaDownload /> Export
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[#2D3748]">
          <thead className="bg-[#0B0D2A]">
            <tr>
              <th className="px-6 py-3 text-left">
                <input
                  type="checkbox"
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedRows(new Set(paginatedData.map((_, i) => i)));
                    } else {
                      setSelectedRows(new Set());
                    }
                  }}
                  className="rounded"
                />
              </th>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  onClick={() => handleSort(col.header)}
                  className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider cursor-pointer hover:bg-[#1C1F4A]"
                >
                  <div className="flex items-center gap-2">
                    {col.header}
                    {sortConfig.key === col.header && (
                      <span className="text-[#5568FE]">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-[#9CA3AF] uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#2D3748]">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 2} className="px-6 py-8 text-center text-[#9CA3AF]">
                  No data available
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rowIdx) => (
                <tr key={rowIdx} className="hover:bg-[#0B0D2A]/50 transition-colors">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(rowIdx)}
                      onChange={(e) => {
                        const newSelected = new Set(selectedRows);
                        if (e.target.checked) {
                          newSelected.add(rowIdx);
                        } else {
                          newSelected.delete(rowIdx);
                        }
                        setSelectedRows(newSelected);
                      }}
                      className="rounded"
                    />
                  </td>
                  {columns.map((col, colIdx) => (
                    <td key={colIdx} className="px-6 py-4 text-sm text-white">
                      {col.accessor(row)}
                    </td>
                  ))}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      {onPreview && (
                        <button
                          onClick={() => onPreview(row)}
                          className="p-2 text-[#5568FE] hover:bg-[#2D3748] rounded lg transition-colors"
                          title="Preview"
                        >
                          <FaEye />
                        </button>
                      )}
                      {onUpdate && (
                        <button
                          onClick={() => onUpdate(row)}
                          className="p-2 text-[#FFD700] hover:bg-[#2D3748] rounded transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 text-[#FF6B6B] hover:bg-[#2D3748] rounded transition-colors"
                          title="Delete"
                        >
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
      <div className="flex items-center justify-between p-4 border-t border-[#2D3748]">
        <p className="text-sm text-[#9CA3AF]">
          Showing {paginatedData.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{' '}
          {Math.min(currentPage * itemsPerPage, filteredData.length)} of {filteredData.length}
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-[#2D3748] text-white rounded hover:bg-[#3D4758] disabled:opacity-50 transition-colors"
          >
            ← Prev
          </button>
          <span className="px-3 py-2 text-[#9CA3AF]">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-[#2D3748] text-white rounded hover:bg-[#3D4758] disabled:opacity-50 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>
    </div>
  );
};

export default DataTable;
```

---

## 3. Status Badge Component

```javascript
// src/components/StatusBadge.jsx

const StatusBadge = ({ status }) => {
  const variants = {
    active: 'bg-[#34D399] text-[#0B0D2A]',
    inactive: 'bg-[#6B7280] text-white',
    pending: 'bg-[#FBBF24] text-[#0B0D2A]',
    confirmed: 'bg-[#34D399] text-[#0B0D2A]',
    completed: 'bg-[#5568FE] text-white',
    cancelled: 'bg-[#EF4444] text-white',
    failed: 'bg-[#DC2626] text-white',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${variants[status] || variants.inactive}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

export default StatusBadge;
```

---

## 4. Enhanced Navbar with Theme Toggle

```javascript
// src/components/Navbar.jsx - Enhanced Version

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChalkboardTeacher, FaUserGraduate, FaBars, FaTimes, FaMoon, FaSun, FaBell } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [profileOpen, setProfileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: FaHome },
    { to: '/teachers', label: 'Teachers', icon: FaChalkboardTeacher },
    { to: '/students', label: 'Students', icon: FaUserGraduate },
  ];

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
    // Persist theme preference
    localStorage.setItem('theme', theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <nav className="bg-[#1C1F4A] border-b border-[#2D3748] shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-white truncate">
              🎓 Super Admin
            </h1>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-[#5568FE] text-white'
                      : 'text-[#9CA3AF] hover:bg-[#2D3748] hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Right icons */}
          <div className="flex items-center gap-3">
            {/* Notifications */}
            <button className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#2D3748] rounded-lg transition-colors relative">
              <FaBell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-[#9CA3AF] hover:text-white hover:bg-[#2D3748] rounded-lg transition-colors"
            >
              {theme === 'dark' ? <FaSun className="w-5 h-5" /> : <FaMoon className="w-5 h-5" />}
            </button>

            {/* Profile dropdown */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="w-10 h-10 bg-[#5568FE] rounded-full text-white font-bold hover:bg-[#4455DD] transition-colors"
              >
                AD
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#1C1F4A] border border-[#2D3748] rounded-lg shadow-lg z-50">
                  <button className="w-full text-left px-4 py-2 text-white hover:bg-[#2D3748] transition-colors">
                    ⚙️ Settings
                  </button>
                  <button className="w-full text-left px-4 py-2 text-white hover:bg-[#2D3748] transition-colors">
                    👤 Profile
                  </button>
                  <hr className="border-[#2D3748]" />
                  <button className="w-full text-left px-4 py-2 text-red-400 hover:bg-[#2D3748] transition-colors">
                    🚪 Logout
                  </button>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden p-2 rounded-lg text-white hover:bg-[#2D3748] transition-colors"
            >
              {mobileOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <div className={`md:hidden border-t border-[#2D3748] overflow-hidden transition-all ${
          mobileOpen ? 'max-h-64' : 'max-h-0'
        }`}>
          <div className="flex flex-col gap-1 py-3">
            {navLinks.map((link) => {
              const IconComponent = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-[#5568FE] text-white'
                      : 'text-[#9CA3AF] hover:bg-[#2D3748] hover:text-white'
                  }`}
                >
                  <IconComponent className="w-5 h-5" />
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
```

---

## 5. Chart Component Example (Using Recharts)

### Installation
```bash
npm install recharts
```

### Usage
```javascript
// src/components/charts/RevenueChart.jsx

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RevenueChart = ({ data }) => {
  return (
    <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl p-6">
      <h2 className="text-white text-xl font-bold mb-4">Revenue Trend</h2>
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
          <XAxis stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" />
          <Tooltip
            contentStyle={{ backgroundColor: '#0B0D2A', border: '1px solid #2D3748' }}
            labelStyle={{ color: '#fff' }}
          />
          <Legend />
          <Line type="monotone" dataKey="revenue" stroke="#5568FE" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default RevenueChart;
```

---

## 6. Loading Skeleton Component

```javascript
// src/components/Skeleton.jsx

const Skeleton = ({ width = 'w-full', height = 'h-4', rounded = 'rounded' }) => {
  return (
    <div className={`${width} ${height} ${rounded} bg-gradient-to-r from-[#2D3748] via-[#3D4758] to-[#2D3748] animate-pulse`} />
  );
};

// Usage in tables
const SkeletonLoader = () => (
  <div className="space-y-4">
    {[...Array(5)].map((_, i) => (
      <Skeleton key={i} height="h-12" />
    ))}
  </div>
);

export default Skeleton;
```

---

## 7. Advanced Form Component

```javascript
// src/components/forms/FormField.jsx

const FormField = ({ label, type = 'text', name, value, onChange, error, required = false, placeholder }) => {
  return (
    <div className="mb-4">
      <label className="block text-white mb-2 font-medium">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 bg-[#0B0D2A] border rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE] ${
            error ? 'border-red-500' : 'border-[#2D3748]'
          }`}
          rows="4"
        />
      ) : (
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={`w-full px-4 py-2 bg-[#0B0D2A] border rounded-lg text-white placeholder-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#5568FE] ${
            error ? 'border-red-500' : 'border-[#2D3748]'
          }`}
        />
      )}
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
};

export default FormField;
```

---

## 8. Quick Implementation Checklist

- [ ] Install react-toastify
- [ ] Install recharts
- [ ] Update Navbar with theme toggle
- [ ] Update DataTable with export & sort
- [ ] Add StatusBadge component
- [ ] Create Skeleton loader
- [ ] Create FormField component
- [ ] Implement toast notifications throughout app
- [ ] Add chart to Dashboard
- [ ] Test responsive design on mobile

---

*These components are production-ready and follow your existing design system.*
