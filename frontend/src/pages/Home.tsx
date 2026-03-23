import { useEffect, useState } from 'react';
import { getArticles, type Article } from '../api';
import PostCard from '../components/PostCard';
import './Home.css';

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getArticles()
      .then((res) => setArticles(res.data))
      .catch(() => setError('加载文章失败，请稍后重试'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="home">
      <div className="home__hero">
        <h1>欢迎来到我的博客</h1>
        <p>记录技术探索与生活感悟</p>
      </div>
      <section className="home__posts">
        {loading && <p className="status-text">加载中...</p>}
        {error && <p className="status-text error">{error}</p>}
        {!loading && !error && articles.length === 0 && (
          <p className="status-text">暂无文章，去后台发一篇吧～</p>
        )}
        <div className="home__grid">
          {articles.map((article) => (
            <PostCard key={article.id} article={article} />
          ))}
        </div>
      </section>
    </main>
  );
}
