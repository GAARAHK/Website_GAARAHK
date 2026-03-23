import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArticle, type Article } from '../api';
import './Article.css';

export default function ArticlePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id) return;
    getArticle(Number(id))
      .then((res) => setArticle(res.data))
      .catch(() => setError('文章不存在或加载失败'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <p className="article-status">加载中...</p>;
  if (error) return <p className="article-status error">{error}</p>;
  if (!article) return null;

  const date = new Date(article.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <main className="article-page">
      <button className="article-back" onClick={() => navigate(-1)}>
        ← 返回
      </button>
      {article.cover_image && (
        <img className="article-cover" src={article.cover_image} alt={article.title} />
      )}
      <h1 className="article-title">{article.title}</h1>
      <p className="article-meta">{date}</p>
      <div
        className="article-content"
        dangerouslySetInnerHTML={{ __html: article.content }}
      />
    </main>
  );
}
