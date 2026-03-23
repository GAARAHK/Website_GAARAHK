import { useEffect, useRef, useState, useCallback } from 'react';
import {
  getArticles,
  getCategories,
  getTags,
  type Article,
  type Category,
  type Tag,
} from '../api';
import PostCard from '../components/PostCard';
import PageTransition from '../components/PageTransition';
import { IconChevronDown, IconChevronLeft, IconChevronRight } from '@tabler/icons-react';
import './Home.css';

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('visible');
          obs.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/** 带 IntersectionObserver fade-in 的侧边栏卡片容器 */
function SidebarFadeCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useFadeIn();
  return (
    <div className={`fade-in ${className ?? ''}`} ref={ref}>
      {children}
    </div>
  );
}

function WelcomeSection({
  articles,
  tagCount,
  onScrollDown,
}: {
  articles: Article[];
  tagCount: number;
  onScrollDown: () => void;
}) {
  const startDate = new Date('2024-01-01');
  const days = Math.floor((Date.now() - startDate.getTime()) / 86400000);
  const covers = articles
    .filter((a) => a.cover_image)
    .slice(0, 8)
    .map((a) => a.cover_image as string);

  return (
    <section className="welcome">
      {/* 背景浮动封面图 */}
      <div className="welcome__bg" aria-hidden="true">
        {covers.map((src, i) => (
          <img
            key={i}
            src={src}
            alt=""
            className={`welcome__bg-img welcome__bg-img--${i + 1}`}
            loading="lazy"
          />
        ))}
      </div>
      <div className="welcome__overlay" />

      {/* 正文内容 */}
      <div className="welcome__content">
        <p className="welcome__sub">欢迎来到</p>
        <h1 className="welcome__title">GAARAHK</h1>
        <p className="welcome__desc">记录技术探索与生活感悟的个人空间</p>

        <div className="welcome__stats">
          <div className="welcome__stat">
            <span className="welcome__stat-num">{days}</span>
            <span className="welcome__stat-label">运营天数</span>
          </div>
          <div className="welcome__stat-sep" />
          <div className="welcome__stat">
            <span className="welcome__stat-num">{articles.length}</span>
            <span className="welcome__stat-label">文章篇数</span>
          </div>
          <div className="welcome__stat-sep" />
          <div className="welcome__stat">
            <span className="welcome__stat-num">{tagCount}</span>
            <span className="welcome__stat-label">标签个数</span>
          </div>
        </div>
      </div>

      <button className="welcome__scroll-btn" onClick={onScrollDown} aria-label="向下滚动">
        <IconChevronDown size={22} stroke={1.8} />
      </button>
    </section>
  );
}

function SidebarProfile({
  articleCount,
  categories,
  tags,
  activeCategory,
  onCategoryChange,
}: {
  articleCount: number;
  categories: Category[];
  tags: Tag[];
  activeCategory: string;
  onCategoryChange: (c: string) => void;
}) {
  const ref = useFadeIn();
  const startDate = new Date('2024-01-01');
  const days = Math.floor((Date.now() - startDate.getTime()) / 86400000);

  return (
    <>
      <div className="sidebar__card fade-in" ref={ref}>
        <div className="sidebar__avatar">G</div>
        <h2 className="sidebar__name">GAARAHK</h2>
        <p className="sidebar__bio">记录技术探索与生活感悟</p>
        <div className="sidebar__divider" />
        <div className="sidebar__stats">
          <div className="sidebar__stat">
            <span className="sidebar__stat-num">{days}</span>
            <span className="sidebar__stat-label">天</span>
          </div>
          <div className="sidebar__stat-sep" />
          <div className="sidebar__stat">
            <span className="sidebar__stat-num">{articleCount}</span>
            <span className="sidebar__stat-label">文章</span>
          </div>
        </div>
      </div>

      {categories.length > 0 && (
        <SidebarFadeCard className="sidebar__card sidebar__card--mt">
          <h3 className="sidebar__section-title">分类</h3>
          <ul className="sidebar__category-list">
            <li>
              <button
                className={`sidebar__category-item${activeCategory === '' ? ' active' : ''}`}
                onClick={() => onCategoryChange('')}
              >
                <span>全部</span>
                <span className="sidebar__category-count">{articleCount}</span>
              </button>
            </li>
            {categories.map((c) => (
              <li key={c.category}>
                <button
                  className={`sidebar__category-item${activeCategory === c.category ? ' active' : ''}`}
                  onClick={() => onCategoryChange(c.category)}
                >
                  <span>{c.category}</span>
                  <span className="sidebar__category-count">{c.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </SidebarFadeCard>
      )}

      {tags.length > 0 && (
        <SidebarFadeCard className="sidebar__card sidebar__card--mt">
          <h3 className="sidebar__section-title">标签</h3>
          <div className="sidebar__tags">
            {tags.map((t) => (
              <button
                key={t.name}
                className={`sidebar__tag${activeCategory === t.name ? ' active' : ''}`}
                onClick={() => onCategoryChange(activeCategory === t.name ? '' : t.name)}
              >
                {t.name}
                <span>{t.count}</span>
              </button>
            ))}
          </div>
        </SidebarFadeCard>
      )}
    </>
  );
}

function Pagination({
  page,
  pages,
  onPageChange,
}: {
  page: number;
  pages: number;
  onPageChange: (p: number) => void;
}) {
  if (pages <= 1) return null;

  const pageNums: number[] = [];
  const start = Math.max(1, page - 2);
  const end = Math.min(pages, page + 2);
  for (let i = start; i <= end; i++) pageNums.push(i);

  return (
    <div className="pagination">
      <button
        className="pagination__btn"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        <IconChevronLeft size={15} stroke={2} />
      </button>
      {start > 1 && (
        <>
          <button className="pagination__page" onClick={() => onPageChange(1)}>1</button>
          {start > 2 && <span className="pagination__ellipsis">…</span>}
        </>
      )}
      {pageNums.map((n) => (
        <button
          key={n}
          className={`pagination__page${n === page ? ' active' : ''}`}
          onClick={() => onPageChange(n)}
        >
          {n}
        </button>
      ))}
      {end < pages && (
        <>
          {end < pages - 1 && <span className="pagination__ellipsis">…</span>}
          <button className="pagination__page" onClick={() => onPageChange(pages)}>{pages}</button>
        </>
      )}
      <button
        className="pagination__btn"
        disabled={page >= pages}
        onClick={() => onPageChange(page + 1)}
      >
        <IconChevronRight size={15} stroke={2} />
      </button>
    </div>
  );
}

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [activeCategory, setActiveCategory] = useState('');
  const contentRef = useRef<HTMLDivElement>(null);

  const scrollToContent = () => {
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchPage = useCallback((p: number, cat: string) => {
    setLoading(true);
    setError('');
    getArticles(p, 10, cat || undefined)
      .then((res) => {
        setArticles(res.data.data);
        setTotalArticles(res.data.total);
        setPage(res.data.page);
        setPages(res.data.pages);
      })
      .catch(() => setError('加载文章失败，请稍后重试'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchPage(1, '');
    // 获取所有文章（欢迎页统计用封面图）
    getArticles(1, 9999)
      .then((r) => setAllArticles(r.data.data))
      .catch(() => {});
    // 获取分类和标签
    getCategories().then((r) => setCategories(r.data)).catch(() => {});
    getTags().then((r) => setTags(r.data)).catch(() => {});
  }, [fetchPage]);

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    fetchPage(1, cat);
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handlePageChange = (p: number) => {
    setPage(p);
    fetchPage(p, activeCategory);
    contentRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <PageTransition>
      <main className="home">
        {/* ── 欢迎横幅 ── */}
        <WelcomeSection
          articles={allArticles}
          tagCount={tags.length}
          onScrollDown={scrollToContent}
        />

        {/* ── 正文内容区 ── */}
        <div ref={contentRef} className="home__body">
          <div className="home__container">
            {/* ── 左侧边栏 ── */}
            <aside className="home__sidebar">
              <SidebarProfile
                articleCount={totalArticles}
                categories={categories}
                tags={tags}
                activeCategory={activeCategory}
                onCategoryChange={handleCategoryChange}
              />
            </aside>

            {/* ── 右侧文章列表 ── */}
            <section className="home__content">
              {loading && (
                <div className="home__status">
                  <span className="home__spinner" />
                  加载中...
                </div>
              )}
              {error && <p className="home__status home__status--error">{error}</p>}
              {!loading && !error && articles.length === 0 && (
                <p className="home__status">
                  {activeCategory ? `「${activeCategory}」分类下暂无文章` : '暂无文章，去后台发一篇吧 ✨'}
                </p>
              )}
              <div className="home__list">
                {articles.map((article, i) => (
                  <PostCard key={article.id} article={article} index={i} />
                ))}
              </div>
              <Pagination page={page} pages={pages} onPageChange={handlePageChange} />
            </section>
          </div>
        </div>
      </main>
    </PageTransition>
  );
}

