// import { useState } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { FaHome, FaChalkboardTeacher, FaUserGraduate, FaBars } from 'react-icons/fa';

// const Navbar = () => {
//   const location = useLocation();
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const isActive = (path) => location.pathname === path;

//   const navLinks = [
//     { to: '/', label: 'Dashboard', icon: FaHome },
//     { to: '/teachers', label: 'Teachers', icon: FaChalkboardTeacher },
//     { to: '/students', label: 'Students', icon: FaUserGraduate },
//   ];

//   return (
//     <nav className="bg-gradient-to-r from-indigo-900 to-blue-900 shadow sticky-top">
//       <div className="container-fluid px-3">

//         <div className="d-flex justify-content-between align-items-center py-2">

//           {/* Brand */}
//           <h4 className="text-white fw-bold m-0">Connectiqo Admin Panel</h4>

//           {/* Mobile Toggle Button */}
//           <button
//             className="btn btn-outline-light d-md-none"
//             onClick={() => setMobileOpen(!mobileOpen)}
//           >
//             <FaBars />
//           </button>

//           {/* Desktop Menu */}
//           <div className="d-none d-md-flex gap-2">
//             {navLinks.map((link) => {
//               const Icon = link.icon;
//               return (
//                 <Link
//                   key={link.to}
//                   to={link.to}
//                   className={`btn btn-sm d-flex align-items-center gap-2 ${
//                     isActive(link.to) ? "btn-primary" : "btn-outline-light"
//                   }`}
//                 >
//                   <Icon /> {link.label}
//                 </Link>
//               );
//             })}
//           </div>

//         </div>

//         {/* Mobile Dropdown Menu */}
//         {mobileOpen && (
//           <div className="d-md-none bg-dark rounded p-2 mb-2 shadow">
//             {navLinks.map((link) => {
//               const Icon = link.icon;
//               return (
//                 <Link
//                   key={link.to}
//                   to={link.to}
//                   onClick={() => setMobileOpen(false)}
//                   className={`btn w-100 text-start mb-1 d-flex align-items-center gap-2 ${
//                     isActive(link.to) ? "btn-primary" : "btn-outline-light"
//                   }`}
//                 >
//                   <Icon /> {link.label}
//                 </Link>
//               );
//             })}
//           </div>
//         )}

//       </div>
//     </nav>
//   );
// };

// export default Navbar;

import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaChalkboardTeacher, FaUserGraduate, FaBars, FaUserCircle } from 'react-icons/fa';
import '../App.css';

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
    <nav className="modern-navbar sticky-top shadow">
      <div className="modern-navbar container-fluid px-3">

        <div className="d-flex justify-content-between align-items-center py-2">

          {/* Brand */}
          <h4 className="text-white fw-bold m-0">Connectiqo Admin</h4>

          {/* Mobile Toggle */}
          <button
            className="btn btn-outline-light d-md-none"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            <FaBars />
          </button>

          {/* Desktop Menu */}
          <div className="d-none d-md-flex align-items-center gap-2">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`btn btn-sm d-flex align-items-center gap-2 ${
                    isActive(link.to) ? "btn-light text-dark fw-bold" : "btn-outline-light"
                  }`}
                >
                  <Icon /> {link.label}
                </Link>
              );
            })}

            {/* Profile Dropdown */}
            <div className="dropdown">
              <button className="btn btn-outline-light dropdown-toggle d-inline-flex align-items-center
" data-bs-toggle="dropdown">
                <FaUserCircle size={20} />
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li><a className="dropdown-item" href="#">Profile</a></li>
                <li><a className="dropdown-item" href="#">Settings</a></li>
                <li><hr className="dropdown-divider" /></li>
                <li><a className="dropdown-item text-danger" href="#">Logout</a></li>
              </ul>
            </div>

          </div>

        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="d-md-none bg-glass rounded p-2 mb-2 shadow">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  onClick={() => setMobileOpen(false)}
                  className={`btn w-100 text-start mb-1 d-flex align-items-center gap-2 ${
                    isActive(link.to) ? "btn-light text-dark fw-bold" : "btn-outline-light"
                  }`}
                >
                  <Icon /> {link.label}
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </nav>
  );
};

export default Navbar;
