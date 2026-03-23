import { Link } from 'react-router-dom';
import type { Article } from '../api';
import './PostCard.css';

interface Props {
  article: Article;
  index?: number;
}

export default function PostCard({ article, index = 0 }: Props) {
  const date = new Date(article.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link
      to={`/article/${article.id}`}
      className="post-card"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <div className="post-card__body">
        <h2 className="post-card__title">{article.title}</h2>
        {article.summary && (
          <p className="post-card__summary">{article.summary}</p>
        )}
        <div className="post-card__meta">
          {article.category && (
            <span className="post-card__category">{article.category}</span>
          )}
          <span className="post-card__date">{date}</span>
        </div>
      </div>
      {article.cover_image && (
        <img
          className="post-card__cover"
          src={article.cover_image}
          alt={article.title}
          loading="lazy"
        />
      )}
    </Link>
  );
}
