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
      accent: 'bg-[#5568FE]',
    },
    {
      title: 'Total Students',
      value: stats.totalStudents,
      icon: FaUserGraduate,
      accent: 'bg-[#34D399]',
    },
    {
      title: 'Total Bookings',
      value: stats.totalBookings,
      icon: FaCalendarCheck,
      accent: 'bg-[#5568FE]',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0B0D2A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <h1 className="text-responsive-title font-bold text-white mb-6 sm:mb-8">
          Dashboard
        </h1>

        {loading ? (
          <div className="flex justify-center items-center min-h-[16rem]">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#5568FE] border-t-transparent" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {statCards.map((stat, idx) => (
              <div
                key={idx}
                className="bg-[#1C1F4A] rounded-xl border border-[#2D3748] p-4 sm:p-5 lg:p-6 hover:border-[#5568FE]/50 transition-colors overflow-hidden"
              >
                <div className="flex items-center justify-between gap-3 sm:gap-4 min-h-0">
                  <div className="min-w-0 flex-1 overflow-hidden">
                    <p className="text-sm font-medium text-[#9CA3AF] truncate">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white mt-1 sm:mt-2 truncate tabular-nums">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.accent} flex shrink-0 items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl`}>
                    <stat.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white flex-shrink-0" aria-hidden />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
