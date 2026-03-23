import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { IconSearch, IconX } from '@tabler/icons-react';
import { searchArticles, type Article } from '../api';
import './SearchModal.css';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function SearchModal({ isOpen, onClose }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQ('');
      setResults([]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    const timer = setTimeout(() => {
      setLoading(true);
      searchArticles(q.trim())
        .then((r) => setResults(r.data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(timer);
  }, [q]);

  if (!isOpen) return null;

  return (
    <div className="search-modal" onClick={onClose}>
      <div className="search-modal__box" onClick={(e) => e.stopPropagation()}>
        <div className="search-modal__input-row">
          <IconSearch size={18} className="search-modal__icon" />
          <input
            ref={inputRef}
            className="search-modal__input"
            placeholder="搜索文章标题、关键词..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          {q ? (
            <button className="search-modal__clear" onClick={() => setQ('')}>
              <IconX size={15} />
            </button>
          ) : (
            <kbd className="search-modal__kbd">ESC</kbd>
          )}
        </div>

        <div className="search-modal__results">
          {loading && <div className="search-modal__hint">搜索中...</div>}
          {!loading && q.trim() && results.length === 0 && (
            <div className="search-modal__hint">未找到「{q}」相关文章</div>
          )}
          {results.map((a) => (
            <Link
              key={a.id}
              to={`/article/${a.id}`}
              className="search-modal__result"
              onClick={onClose}
            >
              {a.cover_image && (
                <img
                  className="search-modal__result-img"
                  src={a.cover_image}
                  alt=""
                  loading="lazy"
                />
              )}
              <div className="search-modal__result-text">
                <div className="search-modal__result-title">{a.title}</div>
                {a.summary && (
                  <div className="search-modal__result-summary">{a.summary}</div>
                )}
              </div>
              {a.category && (
                <span className="search-modal__result-cat">{a.category}</span>
              )}
            </Link>
          ))}
        </div>

        {!q && (
          <div className="search-modal__footer">
            <span>按 <kbd>Ctrl K</kbd> 打开 / <kbd>ESC</kbd> 关闭</span>
          </div>
        )}
      </div>
    </div>
  );
}
