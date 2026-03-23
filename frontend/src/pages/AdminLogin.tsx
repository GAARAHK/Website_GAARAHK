import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminLogin } from '../api';
import PageTransition from '../components/PageTransition';
import './AdminLogin.css';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await adminLogin(password);
      localStorage.setItem('admin_token', res.data.token);
      navigate('/admin/dashboard');
    } catch {
      setError('密码错误，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="login-page">
        <form className="login-card" onSubmit={handleSubmit}>
          <h1 className="login-title">后台管理</h1>
          <p className="login-sub">请输入管理员密码</p>
          <input
            type="password"
            className="login-input"
            placeholder="管理员密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? '登录中...' : '登 录'}
          </button>
        </form>
      </div>
    </PageTransition>
  );
}
