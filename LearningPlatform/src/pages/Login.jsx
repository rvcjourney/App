import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSignInAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, authError, setAuthError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);
    if (!email.trim() || !password) {
      setAuthError('Please enter email and password.');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      if (err?.message !== 'Not super admin') {
        setAuthError(err?.message || 'Login failed.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center py-5">
      <div className="container" style={{ maxWidth: '420px' }}>
        <div className="card bg-secondary bg-opacity-25 border border-secondary shadow-lg">
          <div className="card-body p-4 p-sm-5">
            <h2 className="text-white fw-bold text-center mb-2">Connectiqo</h2>
            <p className="text-secondary text-center small mb-4">Admin Panel</p>

            {authError && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mb-0">
              <div className="mb-3">
                <label className="form-label text-white">Email</label>
                <input
                  type="email"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  disabled={loading}
                />
              </div>
              <div className="mb-4">
                <label className="form-label text-white">Password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-primary w-100 fw-bold py-3 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                <FaSignInAlt size={18} />
                {loading ? 'Signing in…' : 'Sign in'}
              </button>
            </form>

            <div className="text-center mt-4">
              <p className="text-secondary small mb-2">
                Only accounts with Super Admin role can access this panel.
              </p>
              <Link to="/signup" className="btn btn-outline-light w-100 py-2">
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
