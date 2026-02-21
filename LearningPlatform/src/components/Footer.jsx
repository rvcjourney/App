// const Footer = () => {
//   return (
//     <footer className="bg-[#1C1F4A] border-t border-[#2D3748] mt-auto">
//       <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
//         <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
//           <p className="text-sm text-[#9CA3AF] text-center sm:text-left">
//             © {new Date().getFullYear()} Connectiqo. All rights reserved.
//           </p>
//           <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
//             <a href="#" className="text-sm text-[#9CA3AF] hover:text-[#5568FE] transition-colors">
//               Privacy Policy
//             </a>
//             <a href="#" className="text-sm text-[#9CA3AF] hover:text-[#5568FE] transition-colors">
//               Terms of Service
//             </a>
//             <a href="#" className="text-sm text-[#9CA3AF] hover:text-[#5568FE] transition-colors">
//               Support
//             </a>
//           </div>
//         </div>
//       </div>
//     </footer>
//   );
// };

// export default Footer;

const Footer = () => {
  return (
    <footer className="bg-dark border-top mt-auto">
      <div className="container py-4 py-sm-5">
        <div className="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-3 gap-sm-4">
          <p className="mb-2 mb-sm-0 text-center text-sm-start text-white">
            © {new Date().getFullYear()} Connectiqo. All rights reserved.
          </p>
          <div className="d-flex flex-wrap justify-content-center gap-3 gap-sm-4 ">
            <a href="#" className="text-decoration-none hover-primary">
              Privacy Policy
            </a>
            <a href="#" className="text-decoration-none hover-primary">
              Terms of Service
            </a>
            <a href="#" className="text-decoration-none hover-primary">
              Support
            </a>
          </div>
        </div>
      </div>

      {/* Inline CSS for hover color similar to Tailwind */}
      <style jsx>{`
        .hover-primary:hover {
          color: #5568FE !important;
        }
      `}</style>
    </footer>
  );
};

export default Footer;

