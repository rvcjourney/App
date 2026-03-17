import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaUserPlus } from 'react-icons/fa';
import { supabase } from '../config/supabase';

const Signup = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!fullName.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Please enter your email.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { full_name: fullName.trim(), role: 'super_admin' } },
      });
      if (authError) throw authError;

      await supabase.from('profiles').insert({
        id: authData.user.id,
        full_name: fullName.trim(),
        role: 'super_admin',
        email_verified: false,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.message || 'Sign up failed.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center py-5">
        <div className="container" style={{ maxWidth: '420px' }}>
          <div className="card bg-secondary bg-opacity-25 border border-secondary shadow-lg">
            <div className="card-body p-4 p-sm-5 text-center">
              <div className="text-success mb-3">
                <FaUserPlus size={48} />
              </div>
              <h3 className="text-white fw-bold mb-2">Account created</h3>
              <p className="text-secondary mb-4">
                You can now sign in with your email and password.
              </p>
              <Link to="/" className="btn btn-primary">
                Go to Sign in
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center py-5">
      <div className="container" style={{ maxWidth: '420px' }}>
        <div className="card bg-secondary bg-opacity-25 border border-secondary shadow-lg">
          <div className="card-body p-4 p-sm-5">
            <h2 className="text-white fw-bold text-center mb-2">Create account</h2>
            <p className="text-secondary text-center small mb-4">Connectiqo – Admin Panel</p>

            {error && (
              <div className="alert alert-danger py-2 mb-3" role="alert">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label text-white">Full name</label>
                <input
                  type="text"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Your name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  autoComplete="name"
                  disabled={loading}
                />
              </div>
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
              <div className="mb-3">
                <label className="form-label text-white">Password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
                <div className="form-text text-secondary">At least 6 characters</div>
              </div>
              <div className="mb-4">
                <label className="form-label text-white">Confirm password</label>
                <input
                  type="password"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                className="btn btn-success w-100 fw-bold py-3 d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                <FaUserPlus size={18} />
                {loading ? 'Creating account…' : 'Sign up'}
              </button>
            </form>

            <p className="text-secondary small text-center mt-4 mb-0">
              Already have an account?{' '}
              <Link to="/" className="text-primary text-decoration-none fw-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
