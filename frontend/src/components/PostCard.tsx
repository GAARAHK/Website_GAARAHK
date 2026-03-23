import { Link } from 'react-router-dom';
import type { Article } from '../api';
import './PostCard.css';

interface Props {
  article: Article;
}

export default function PostCard({ article }: Props) {
  const date = new Date(article.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <Link to={`/article/${article.id}`} className="post-card">
      {article.cover_image && (
        <img
          className="post-card__cover"
          src={article.cover_image}
          alt={article.title}
        />
      )}
      <div className="post-card__body">
        <h2 className="post-card__title">{article.title}</h2>
        <p className="post-card__summary">{article.summary}</p>
        <span className="post-card__date">{date}</span>
      </div>
    </Link>
  );
}
