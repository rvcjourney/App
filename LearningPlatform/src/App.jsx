import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Teachers from './pages/Teachers';
import Students from './pages/Students';
import './index.css';
import './App.css';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen max-w-7xl mx-auto w-full">
        <Navbar />
        <main className="flex-grow">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/teachers" element={<Teachers />} />
            <Route path="/students" element={<Students />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
