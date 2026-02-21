# 🚀 New Features - Implementation Starter Pack

## Feature 1: Advanced Dashboard with Charts

### File: `src/pages/Dashboard.jsx` (UPDATED)

```javascript
import { useEffect, useState } from 'react';
import { FaChalkboardTeacher, FaUserGraduate, FaCalendarCheck, FaMoneyBillWave, FaArrowUp, FaArrowDown } from 'react-icons/fa';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getDashboardStats, getDashboardCharts } from '../services/api';
import Skeleton from '../components/Skeleton';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalBookings: 0,
    totalRevenue: 0,
    growth: { teachers: 5, students: 12, bookings: 8, revenue: 15 },
  });
  const [chartData, setChartData] = useState({
    revenue: [],
    bookings: [],
    topTeachers: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [statsData, chartsData] = await Promise.all([
        getDashboardStats(),
        getDashboardCharts(),
      ]);
      setStats(statsData);
      setChartData(chartsData);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, icon: Icon, accent, growth, isLoading }) => {
    const isPositive = growth >= 0;
    return (
      <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl p-6 hover:border-[#5568FE]/50 transition-all hover:shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#9CA3AF] text-sm font-medium">{title}</p>
            {isLoading ? (
              <Skeleton width="w-24" height="h-8" className="mt-2" />
            ) : (
              <p className="text-3xl font-bold text-white mt-2">{value.toLocaleString()}</p>
            )}
            <div className={`flex items-center gap-1 mt-2 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
              {isPositive ? <FaArrowUp /> : <FaArrowDown />}
              <span>{Math.abs(growth)}% from last month</span>
            </div>
          </div>
          <div className={`${accent} h-16 w-16 rounded-xl flex items-center justify-center`}>
            <Icon className="text-white text-2xl" />
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B0D2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-[#9CA3AF]">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stat Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Teachers"
            value={stats.totalTeachers}
            icon={FaChalkboardTeacher}
            accent="bg-[#5568FE]"
            growth={stats.growth.teachers}
            isLoading={loading}
          />
          <StatCard
            title="Total Students"
            value={stats.totalStudents}
            icon={FaUserGraduate}
            accent="bg-[#34D399]"
            growth={stats.growth.students}
            isLoading={loading}
          />
          <StatCard
            title="Total Bookings"
            value={stats.totalBookings}
            icon={FaCalendarCheck}
            accent="bg-[#FBBF24]"
            growth={stats.growth.bookings}
            isLoading={loading}
          />
          <StatCard
            title="Total Revenue"
            value={stats.totalRevenue}
            icon={FaMoneyBillWave}
            accent="bg-[#10B981]"
            growth={stats.growth.revenue}
            isLoading={loading}
          />
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl p-6">
            <h2 className="text-white text-lg font-bold mb-4">Revenue Trend (Last 30 Days)</h2>
            {loading ? (
              <Skeleton width="w-full" height="h-64" className="rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData.revenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2D3748" />
                  <XAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#9CA3AF" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0D2A', border: '1px solid #2D3748', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Legend />
                  <Line
                    dataKey="amount"
                    stroke="#5568FE"
                    strokeWidth={2}
                    dot={{ fill: '#5568FE', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Bookings Chart */}
          <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl p-6">
            <h2 className="text-white text-lg font-bold mb-4">Bookings Status</h2>
            {loading ? (
              <Skeleton width="w-full" height="h-64" className="rounded" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData.bookings}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    <Cell fill="#5568FE" />
                    <Cell fill="#34D399" />
                    <Cell fill="#FBBF24" />
                    <Cell fill="#EF4444" />
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0B0D2A', border: '1px solid #2D3748', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Top Teachers */}
        <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl p-6">
          <h2 className="text-white text-lg font-bold mb-4">Top Performing Teachers</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b border-[#2D3748]">
                  <th className="text-left text-[#9CA3AF] font-medium py-3">Teacher Name</th>
                  <th className="text-left text-[#9CA3AF] font-medium py-3">Rating</th>
                  <th className="text-left text-[#9CA3AF] font-medium py-3">Bookings</th>
                  <th className="text-left text-[#9CA3AF] font-medium py-3">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-[#2D3748]">
                      <td className="py-3"><Skeleton width="w-32" height="h-4" /></td>
                      <td className="py-3"><Skeleton width="w-16" height="h-4" /></td>
                      <td className="py-3"><Skeleton width="w-12" height="h-4" /></td>
                      <td className="py-3"><Skeleton width="w-20" height="h-4" /></td>
                    </tr>
                  ))
                ) : (
                  chartData.topTeachers.map((teacher, idx) => (
                    <tr key={idx} className="border-b border-[#2D3748] hover:bg-[#0B0D2A]/50">
                      <td className="py-3 text-white">{teacher.name}</td>
                      <td className="py-3 text-[#34D399]">⭐ {teacher.rating}</td>
                      <td className="py-3 text-white">{teacher.bookings}</td>
                      <td className="py-3 text-[#FFD700]">₹{teacher.revenue.toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

---

## Feature 2: Bookings Management Page

### File: `src/pages/Bookings.jsx` (NEW)

```javascript
import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import Modal from '../components/Modal';
import StatusBadge from '../components/StatusBadge';
import { getAllBookings, updateBookingStatus, cancelBooking } from '../services/api';
import { FaCheckCircle, FaTimesCircle, FaEye, FaTrash } from 'react-icons/fa';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await getAllBookings();
      setBookings(data);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (booking) => {
    if (window.confirm('Approve this booking?')) {
      try {
        await updateBookingStatus(booking.id, 'confirmed');
        alert('Booking approved!');
        loadBookings();
      } catch (error) {
        alert('Error approving booking');
      }
    }
  };

  const handleReject = async (booking) => {
    if (window.confirm('Reject this booking?')) {
      try {
        await updateBookingStatus(booking.id, 'cancelled');
        alert('Booking rejected!');
        loadBookings();
      } catch (error) {
        alert('Error rejecting booking');
      }
    }
  };

  const handlePreview = (booking) => {
    setSelectedBooking(booking);
    setModalType('preview');
  };

  const filteredBookings = filterStatus === 'all' 
    ? bookings 
    : bookings.filter(b => b.status === filterStatus);

  const columns = [
    {
      header: 'Teacher',
      accessor: (row) => row.teacherProfile?.full_name || 'N/A',
    },
    {
      header: 'Student',
      accessor: (row) => row.studentProfile?.full_name || 'N/A',
    },
    {
      header: 'Date',
      accessor: (row) => new Date(row.booking_date).toLocaleDateString(),
    },
    {
      header: 'Time',
      accessor: (row) => row.start_time || 'N/A',
    },
    {
      header: 'Amount',
      accessor: (row) => `₹${row.amount || 0}`,
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D2A] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">Bookings Management</h1>
          
          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'confirmed', 'completed', 'cancelled'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-[#5568FE] text-white'
                    : 'bg-[#1C1F4A] text-[#9CA3AF] hover:bg-[#2D3748]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          data={filteredBookings}
          columns={columns}
          loading={loading}
          onPreview={handlePreview}
          title="Bookings"
          onExport={() => {
            // Implement export logic
          }}
        />

        {/* Action buttons for filtered items */}
        {filterStatus === 'pending' && (
          <div className="mt-6 p-4 bg-[#1C1F4A] rounded-lg border border-[#2D3748]">
            <p className="text-[#9CA3AF] mb-4">Pending Bookings Actions:</p>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  filteredBookings.forEach(b => handleApprove(b));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#34D399] text-[#0B0D2A] rounded-lg hover:bg-[#10B981] font-medium transition-colors"
              >
                <FaCheckCircle /> Approve All
              </button>
              <button
                onClick={() => {
                  filteredBookings.forEach(b => handleReject(b));
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] font-medium transition-colors"
              >
                <FaTimesCircle /> Reject All
              </button>
            </div>
          </div>
        )}

        {/* Preview Modal */}
        {modalType === 'preview' && selectedBooking && (
          <Modal title="Booking Details" onClose={() => setModalType(null)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[#9CA3AF] text-sm">Teacher</p>
                  <p className="text-white font-medium">{selectedBooking.teacherProfile?.full_name}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-sm">Student</p>
                  <p className="text-white font-medium">{selectedBooking.studentProfile?.full_name}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-sm">Date & Time</p>
                  <p className="text-white font-medium">{new Date(selectedBooking.booking_date).toLocaleDateString()} {selectedBooking.start_time}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-sm">Amount</p>
                  <p className="text-[#FFD700] font-medium">₹{selectedBooking.amount}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-sm">Subject</p>
                  <p className="text-white font-medium">{selectedBooking.subject || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#9CA3AF] text-sm">Status</p>
                  <StatusBadge status={selectedBooking.status} />
                </div>
              </div>

              {selectedBooking.status === 'pending' && (
                <div className="flex gap-2 pt-4">
                  <button
                    onClick={() => {
                      handleApprove(selectedBooking);
                      setModalType(null);
                    }}
                    className="flex-1 px-4 py-2 bg-[#34D399] text-[#0B0D2A] rounded-lg hover:bg-[#10B981] font-medium transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleReject(selectedBooking);
                      setModalType(null);
                    }}
                    className="flex-1 px-4 py-2 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626] font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          </Modal>
        )}
      </div>
    </div>
  );
};

export default Bookings;
```

---

## Feature 3: Activity Feed Component

### File: `src/components/ActivityFeed.jsx` (NEW)

```javascript
import { useEffect, useState } from 'react';
import { FaUser, FaCalendar, FaMoneyBillWave, FaCheckCircle } from 'react-icons/fa';

const ActivityFeed = ({ limit = 10 }) => {
  const [activities, setActivities] = useState([
    {
      id: 1,
      type: 'booking',
      message: 'New booking created',
      description: 'John created a booking with Sarah',
      timestamp: new Date(),
      icon: FaCalendar,
      color: 'text-blue-400',
    },
    {
      id: 2,
      type: 'payment',
      message: 'Payment received',
      description: '₹500 from Student Account',
      timestamp: new Date(Date.now() - 3600000),
      icon: FaMoneyBillWave,
      color: 'text-green-400',
    },
    {
      id: 3,
      type: 'user',
      message: 'New teacher registered',
      description: 'Dr. Emma Wilson joined',
      timestamp: new Date(Date.now() - 7200000),
      icon: FaUser,
      color: 'text-purple-400',
    },
  ]);

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <div className="bg-[#1C1F4A] border border-[#2D3748] rounded-xl p-6">
      <h2 className="text-white text-lg font-bold mb-4">Recent Activity</h2>
      <div className="space-y-4">
        {activities.slice(0, limit).map((activity) => {
          const Icon = activity.icon;
          return (
            <div key={activity.id} className="flex items-start gap-4 pb-4 border-b border-[#2D3748] last:border-0">
              <div className={`p-3 rounded-lg bg-[#0B0D2A] ${activity.color}`}>
                <Icon className="text-lg" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-medium">{activity.message}</p>
                <p className="text-[#9CA3AF] text-sm">{activity.description}</p>
                <p className="text-[#6B7280] text-xs mt-1">{formatTime(activity.timestamp)}</p>
              </div>
            </div>
          );
        })}
      </div>
      <button className="mt-4 w-full py-2 text-[#5568FE] hover:bg-[#0B0D2A] rounded-lg transition-colors">
        View All Activity
      </button>
    </div>
  );
};

export default ActivityFeed;
```

---

## Feature 4: Payments Dashboard

### File: `src/pages/Payments.jsx` (NEW)

```javascript
import { useEffect, useState } from 'react';
import DataTable from '../components/DataTable';
import StatusBadge from '../components/StatusBadge';
import { getAllPayments } from '../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    loadPayments();
  }, []);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const data = await getAllPayments();
      setPayments(data);
    } catch (error) {
      console.error('Error loading payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = filterStatus === 'all'
    ? payments
    : payments.filter(p => p.status === filterStatus);

  const columns = [
    {
      header: 'Transaction ID',
      accessor: (row) => row.transaction_id || 'N/A',
    },
    {
      header: 'Amount',
      accessor: (row) => `₹${row.amount || 0}`,
    },
    {
      header: 'From',
      accessor: (row) => row.from_user?.full_name || 'N/A',
    },
    {
      header: 'To',
      accessor: (row) => row.to_user?.full_name || 'N/A',
    },
    {
      header: 'Method',
      accessor: (row) => row.payment_method || 'Card',
    },
    {
      header: 'Date',
      accessor: (row) => new Date(row.created_at).toLocaleDateString(),
    },
    {
      header: 'Status',
      accessor: (row) => <StatusBadge status={row.status} />,
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D2A] py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-4">Payment Management</h1>
          
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-[#1C1F4A] p-4 rounded-lg border border-[#2D3748]">
              <p className="text-[#9CA3AF] text-sm">Total Revenue</p>
              <p className="text-2xl font-bold text-[#FFD700]">₹{payments.reduce((sum, p) => p.status === 'completed' ? sum + p.amount : sum, 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#1C1F4A] p-4 rounded-lg border border-[#2D3748]">
              <p className="text-[#9CA3AF] text-sm">Pending</p>
              <p className="text-2xl font-bold text-[#FBBF24]">₹{payments.reduce((sum, p) => p.status === 'pending' ? sum + p.amount : sum, 0).toLocaleString()}</p>
            </div>
            <div className="bg-[#1C1F4A] p-4 rounded-lg border border-[#2D3748]">
              <p className="text-[#9CA3AF] text-sm">Failed</p>
              <p className="text-2xl font-bold text-[#EF4444]">₹{payments.reduce((sum, p) => p.status === 'failed' ? sum + p.amount : sum, 0).toLocaleString()}</p>
            </div>
          </div>

          {/* Filter buttons */}
          <div className="flex flex-wrap gap-2">
            {['all', 'completed', 'pending', 'failed'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filterStatus === status
                    ? 'bg-[#5568FE] text-white'
                    : 'bg-[#1C1F4A] text-[#9CA3AF] hover:bg-[#2D3748]'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <DataTable
          data={filteredPayments}
          columns={columns}
          loading={loading}
          title="Payments"
        />
      </div>
    </div>
  );
};

export default Payments;
```

---

## Implementation Steps

### Step 1: Install Dependencies
```bash
npm install recharts react-toastify date-fns
```

### Step 2: Update App.jsx
```javascript
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import Bookings from './pages/Bookings';  // NEW
import Payments from './pages/Payments';  // NEW
import './index.css';
import './App.css';

function App() {
  return (
    <Router>
      <ToastContainer /> {/* ADD THIS */}
      <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
            <Route path="/bookings" element={<Bookings />} />  {/* NEW */}
            <Route path="/payments" element={<Payments />} />  {/* NEW */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
```

### Step 3: Update Navbar with New Links
```javascript
const navLinks = [
  { to: '/', label: 'Dashboard', icon: FaHome },
  { to: '/teachers', label: 'Teachers', icon: FaChalkboardTeacher },
  { to: '/students', label: 'Students', icon: FaUserGraduate },
  { to: '/bookings', label: 'Bookings', icon: FaCalendarCheck },  // NEW
  { to: '/payments', label: 'Payments', icon: FaMoneyBillWave },  // NEW
];
```

---

## API Functions to Create

Add these functions to `src/services/api.js`:

```javascript
// Chart data
export const getDashboardCharts = async () => {
  // Mock data - replace with actual API call
  return {
    revenue: [
      { date: '1', amount: 5000 },
      { date: '2', amount: 6000 },
      // ...more data
    ],
    bookings: [
      { name: 'Confirmed', value: 45 },
      { name: 'Pending', value: 20 },
      { name: 'Completed', value: 30 },
      { name: 'Cancelled', value: 5 },
    ],
    topTeachers: [
      { name: 'Dr. Sarah', rating: 4.9, bookings: 125, revenue: 50000 },
      // ...more teachers
    ],
  };
};

// Bookings
export const getAllBookings = async () => {
  const response = await supabase
    .from('bookings')
    .select('*, teacherProfile:teacher_id(full_name), studentProfile:student_id(full_name)')
    .order('created_at', { ascending: false });
  
  if (response.error) throw response.error;
  return response.data;
};

export const updateBookingStatus = async (bookingId, status) => {
  const response = await supabase
    .from('bookings')
    .update({ status })
    .eq('id', bookingId);
  
  if (response.error) throw response.error;
  return response.data;
};

// Payments
export const getAllPayments = async () => {
  const response = await supabase
    .from('payments')
    .select('*, from_user:from_user_id(full_name), to_user:to_user_id(full_name)')
    .order('created_at', { ascending: false });
  
  if (response.error) throw response.error;
  return response.data;
};
```

---

*These features are ready to implement and will significantly enhance your platform!*
