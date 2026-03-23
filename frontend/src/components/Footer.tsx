import { Link } from 'react-router-dom';
import './Footer.css';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="footer">
      <div className="footer__inner">
        <span className="footer__copy">
          © {year} GAARAHK · 用 ❤️ 记录每一天
        </span>
        <div className="footer__links">
          <Link to="/" className="footer__link">首页</Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            className="footer__link"
          >
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}
