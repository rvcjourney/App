import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaChalkboardTeacher, FaUserGraduate, FaCalendarCheck, FaMoneyBillWave } from 'react-icons/fa';
import { getDashboardStats } from '../services/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.7:3000';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalBookings: 0,
  });
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [withdrawalsLoading, setWithdrawalsLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data || { totalTeachers: 0, totalStudents: 0, totalBookings: 0 });
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
      setStats({ totalTeachers: 0, totalStudents: 0, totalBookings: 0 });
    } finally {
      setLoading(false);
    }
  };

  const loadWithdrawals = async () => {
    try {
      setWithdrawalsLoading(true);
      const res = await fetch(`${API_URL}/api/admin/withdrawals`);
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setWithdrawals(json.data);
      } else {
        setWithdrawals([]);
      }
    } catch (_) {
      setWithdrawals([]);
    } finally {
      setWithdrawalsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Teachers',
      value: stats.totalTeachers,
      icon: FaChalkboardTeacher,
      color: 'primary',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: FaUserGraduate,
      color: 'success',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: FaCalendarCheck,
      color: 'warning',
    },
  ];

  return (
    <div className="min-vh-100 bg-dark text-white py-4">
      <div className="container">

        {/* Header */}
        <h2 className="fw-bold mb-2">Dashboard</h2>
        <p className="text-secondary mb-4">Platform statistics overview</p>

        {/* Loading */}
        {loading ? (
          <div className="d-flex justify-content-center align-items-center" style={{ height: '200px' }}>
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <div className="row g-4">
            {statCards.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div className="col-12 col-md-6 col-lg-4" key={idx}>
                  <div className="card bg-secondary bg-opacity-10 border border-secondary shadow-lg h-100">

                    {/* Card Body */}
                    <div className="card-body d-flex justify-content-between align-items-center">
                      <div>
                        <p className="text-secondary mb-1">{stat.title}</p>
                        <h3 className="fw-bold text-white">{stat.value}</h3>
                      </div>

                      <div className={`bg-${stat.color} bg-gradient rounded-circle p-3`}>
                        <Icon size={28} className="text-white" />
                      </div>
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Withdrawal requests – summary with link to Finance (full payouts as on mobile admin) */}
        <section className="mt-5">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="fw-bold text-white mb-0 d-flex align-items-center gap-2">
              <FaMoneyBillWave className="text-warning" />
              Withdrawal requests
            </h5>
            <Link to="/finance" className="btn btn-sm btn-warning text-dark">
              Manage payouts →
            </Link>
          </div>
          {withdrawalsLoading ? (
            <div className="d-flex justify-content-center py-4">
              <div className="spinner-border text-warning" role="status"></div>
            </div>
          ) : (
            <div className="card bg-secondary bg-opacity-10 border border-secondary shadow-lg">
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-dark table-hover mb-0">
                    <thead>
                      <tr>
                        <th className="border-secondary">Name</th>
                        <th className="border-secondary">Account</th>
                        <th className="border-secondary text-end">Amount</th>
                        <th className="border-secondary">Requested</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawals.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="text-center text-secondary py-4">
                            No pending withdrawal requests
                          </td>
                        </tr>
                      ) : (
                        withdrawals.slice(0, 5).map((req) => (
                          <tr key={req.id}>
                            <td className="border-secondary">{req.sender?.full_name || req.account_holder_name || '—'}</td>
                            <td className="border-secondary font-monospace">{req.bank_account_number_masked || '******'}</td>
                            <td className="border-secondary text-end text-warning fw-bold">₹{Number(req.amount).toLocaleString()}</td>
                            <td className="border-secondary text-secondary">{req.requested_at ? new Date(req.requested_at).toLocaleString() : '—'}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                {withdrawals.length > 5 && (
                  <div className="card-footer bg-dark border-secondary text-secondary small">
                    +{withdrawals.length - 5} more. <Link to="/finance" className="text-warning">View all in Finance</Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
