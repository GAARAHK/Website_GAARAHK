import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { IconArrowLeft } from '@tabler/icons-react';
import hljs from 'highlight.js';
import 'highlight.js/styles/github-dark.css';
import { getArticle, type Article } from '../api';
import PageTransition from '../components/PageTransition';
import ReadingProgress from '../components/ReadingProgress';
import VideoPlayer from '../components/VideoPlayer';
import './Article.css';

// 解析正文中的 [video:URL|标题] 语法
function renderContent(html: string): React.ReactNode[] {
  const parts = html.split(/\[video:([^\]|]+?)(?:\|([^\]]*))?\]/g);
  const nodes: React.ReactNode[] = [];
  for (let i = 0; i < parts.length; i++) {
    const mod = i % 3;
    if (mod === 0) {
      if (parts[i]) {
        nodes.push(<div key={i} dangerouslySetInnerHTML={{ __html: parts[i] }} />);
      }
    } else if (mod === 1) {
      const title = parts[i + 1] || undefined;
      nodes.push(<VideoPlayer key={i} url={parts[i]} title={title} />);
      i++;
    }
  }
  return nodes;
}

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

  useEffect(() => {
    if (!article) return;
    document.querySelectorAll('.article-content pre code').forEach((block) => {
      hljs.highlightElement(block as HTMLElement);
    });
  }, [article]);

  if (loading) return (
    <div className="article-status">
      <div className="article-spinner" />
    </div>
  );
  if (error) return <p className="article-status article-status--error">{error}</p>;
  if (!article) return null;

  const date = new Date(article.created_at).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <PageTransition>
      <ReadingProgress />
      <main className="article-page">
        <motion.button
          className="article-back"
          onClick={() => navigate(-1)}
          whileHover={{ x: -4 }}
          whileTap={{ scale: 0.95 }}
        >
          <IconArrowLeft size={18} stroke={2} />
          返回
        </motion.button>

        {article.cover_image && (
          <motion.img
            className="article-cover"
            src={article.cover_image}
            alt={article.title}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          />
        )}

        <motion.h1
          className="article-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {article.title}
        </motion.h1>

        <motion.p
          className="article-meta"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {date}
        </motion.p>

        <motion.div
          className="article-content"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
          {renderContent(article.content)}
        </motion.div>
      </main>
    </PageTransition>
  );
}
