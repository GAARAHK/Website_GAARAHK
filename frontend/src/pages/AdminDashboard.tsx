import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  type Article,
} from '../api';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  // 编辑器状态
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  const logout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  const load = () => {
    setLoading(true);
    getArticles()
      .then((r) => setArticles(r.data))
      .catch(() => setMsg('加载失败'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const token = localStorage.getItem('admin_token');
    if (!token) navigate('/admin');
    else load();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setMsg('');
    try {
      if (editing.id) {
        await updateArticle(editing.id, editing);
        setMsg('文章已更新');
      } else {
        await createArticle(editing);
        setMsg('文章已发布');
      }
      setEditing(null);
      load();
    } catch {
      setMsg('保存失败，请检查后端是否运行');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除这篇文章吗？')) return;
    await deleteArticle(id);
    load();
  };

  return (
    <div className="dashboard">
      <div className="dashboard__header">
        <h1>文章管理</h1>
        <div className="dashboard__header-actions">
          <button
            className="btn btn--primary"
            onClick={() => setEditing({ title: '', summary: '', content: '' })}
          >
            + 新建文章
          </button>
          <button className="btn btn--ghost" onClick={logout}>
            退出登录
          </button>
        </div>
      </div>

      {msg && <p className="dashboard__msg">{msg}</p>}

      {/* 文章编辑器（嵌入式） */}
      {editing && (
        <div className="editor-backdrop">
          <form className="editor-card" onSubmit={handleSave}>
            <h2>{editing.id ? '编辑文章' : '新建文章'}</h2>
            <input
              className="editor-input"
              placeholder="文章标题"
              value={editing.title ?? ''}
              onChange={(e) => setEditing({ ...editing, title: e.target.value })}
              required
            />
            <input
              className="editor-input"
              placeholder="摘要（可选）"
              value={editing.summary ?? ''}
              onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
            />
            <input
              className="editor-input"
              placeholder="封面图 URL（可选）"
              value={editing.cover_image ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, cover_image: e.target.value })
              }
            />
            <textarea
              className="editor-textarea"
              placeholder="文章内容（支持 HTML）"
              rows={14}
              value={editing.content ?? ''}
              onChange={(e) =>
                setEditing({ ...editing, content: e.target.value })
              }
              required
            />
            <div className="editor-actions">
              <button type="submit" className="btn btn--primary" disabled={saving}>
                {saving ? '保存中...' : '保 存'}
              </button>
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => setEditing(null)}
              >
                取 消
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 文章列表 */}
      <div className="dashboard__list">
        {loading && <p className="dashboard__msg">加载中...</p>}
        {!loading && articles.length === 0 && (
          <p className="dashboard__msg">还没有文章，点击"新建文章"开始写吧！</p>
        )}
        {articles.map((article) => (
          <div key={article.id} className="dashboard__item">
            <div className="dashboard__item-info">
              <span className="dashboard__item-title">{article.title}</span>
              <span className="dashboard__item-date">
                {new Date(article.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <div className="dashboard__item-actions">
              <button
                className="btn btn--sm"
                onClick={() => setEditing(article)}
              >
                编辑
              </button>
              <button
                className="btn btn--sm btn--danger"
                onClick={() => handleDelete(article.id)}
              >
                删除
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
