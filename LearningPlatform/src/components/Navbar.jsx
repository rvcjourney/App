import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChalkboardTeacher, FaUserGraduate, FaBars, FaTimes } from 'react-icons/fa';

const Navbar = () => {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isActive = (path) => location.pathname === path;

  const navLinks = [
    { to: '/', label: 'Dashboard', icon: FaHome },
    { to: '/teachers', label: 'Teachers', icon: FaChalkboardTeacher },
    { to: '/students', label: 'Students', icon: FaUserGraduate },
  ];

  return (
    <nav className="bg-[#1C1F4A] border-b border-[#2D3748] shadow-lg sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-14 sm:h-16">
          <div className="flex items-center">
            <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">
              Super Admin Portal
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
                  className={`flex items-center gap-2 px-3 py-2 sm:px-4 rounded-lg text-sm font-medium transition-colors ${
                    isActive(link.to)
                      ? 'bg-[#5568FE] text-white'
                      : 'text-[#9CA3AF] hover:bg-[#2D3748] hover:text-white'
                  }`}
                >
                  <IconComponent className="shrink-0" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          {/* Mobile menu button */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-[#2D3748] transition-colors"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <FaTimes className="w-6 h-6" /> : <FaBars className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden py-3 border-t border-[#2D3748]">
            <div className="flex flex-col gap-1">
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
                    <IconComponent className="shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
