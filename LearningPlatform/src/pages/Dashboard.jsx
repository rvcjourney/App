import { useEffect, useState } from 'react';
import { FaChalkboardTeacher, FaUserGraduate, FaCalendarCheck } from 'react-icons/fa';
import { getDashboardStats } from '../services/api';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTeachers: 0,
    totalStudents: 0,
    totalBookings: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      const data = await getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Error loading dashboard stats:', error);
    } finally {
      setLoading(false);
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
      </div>
    </div>
  );
};

export default Dashboard;
