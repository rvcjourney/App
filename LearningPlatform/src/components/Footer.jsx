const Footer = () => {
  return (
    <footer className="bg-[#1C1F4A] border-t border-[#2D3748] mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-[#9CA3AF] text-center sm:text-left">
            © {new Date().getFullYear()} LearnEasy. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
            <a href="#" className="text-sm text-[#9CA3AF] hover:text-[#5568FE] transition-colors">
              Privacy Policy
            </a>
            <a href="#" className="text-sm text-[#9CA3AF] hover:text-[#5568FE] transition-colors">
              Terms of Service
            </a>
            <a href="#" className="text-sm text-[#9CA3AF] hover:text-[#5568FE] transition-colors">
              Support
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
