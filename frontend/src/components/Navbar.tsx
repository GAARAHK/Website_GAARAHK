import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const isAdmin = pathname.startsWith('/admin');

  return (
    <nav className="navbar">
      <Link to="/" className="navbar__brand">
        GAARAHK Blog
      </Link>
      <div className="navbar__links">
        <Link to="/" className={pathname === '/' ? 'active' : ''}>首页</Link>
        {!isAdmin && (
          <Link to="/admin" className={isAdmin ? 'active' : ''}>后台管理</Link>
        )}
      </div>
    </nav>
  );
}
