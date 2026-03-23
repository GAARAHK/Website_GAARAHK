import { useRef, useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { IconHome, IconUser, IconSearch, IconSun, IconMoon } from '@tabler/icons-react';
import SearchModal from './SearchModal';
import './Navbar.css';

export default function Navbar() {
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [dark, setDark] = useState(() => localStorage.getItem('dark') === 'true');
  const [searchOpen, setSearchOpen] = useState(false);
  const lastYRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const delta = y - lastYRef.current;
      setScrolled(y > 20);
      if (Math.abs(delta) > 8) {
        setHidden(delta > 0 && y > 120);
        lastYRef.current = y;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // 暗色模式同步
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('dark', String(dark));
  }, [dark]);

  // Ctrl+K 打开搜索
  const handleKeydown = useCallback((e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      setSearchOpen(true);
    }
    if (e.key === 'Escape') setSearchOpen(false);
  }, []);
  useEffect(() => {
    window.addEventListener('keydown', handleKeydown);
    return () => window.removeEventListener('keydown', handleKeydown);
  }, [handleKeydown]);

  return (
    <>
      <header className={`header${scrolled ? ' header--active' : ''}${hidden ? ' header--hide' : ''}`}>
        <div className="header__container">
          <Link to="/" className="header__logo">GAARAHK</Link>

          <nav className="header__pill-nav">
            <Link to="/" className={`header__nav-link${pathname === '/' ? ' active' : ''}`}>
              <IconHome size={14} stroke={2} />
              首页
            </Link>
            <Link
              to="/admin"
              className={`header__nav-link${pathname.startsWith('/admin') ? ' active' : ''}`}
            >
              <IconUser size={14} stroke={2} />
              后台
            </Link>
          </nav>

          <div className="header__actions">
            <button
              className="header__icon-btn"
              onClick={() => setSearchOpen(true)}
              title="搜索 (Ctrl+K)"
            >
              <IconSearch size={17} stroke={1.8} />
            </button>
            <button
              className="header__icon-btn"
              onClick={() => setDark(!dark)}
              title={dark ? '切换浅色' : '切换深色'}
            >
              {dark ? <IconSun size={17} stroke={1.8} /> : <IconMoon size={17} stroke={1.8} />}
            </button>
          </div>
        </div>
      </header>
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
