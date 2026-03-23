import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IconPlus, IconEdit, IconTrash, IconLogout, IconX } from '@tabler/icons-react';
import {
  getAllArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  uploadFile,
  type Article,
} from '../api';
import RichEditor from '../components/RichEditor';
import PageTransition from '../components/PageTransition';
import './AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Partial<Article> | null>(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);

  const logout = () => {
    localStorage.removeItem('admin_token');
    navigate('/admin');
  };

  const load = () => {
    setLoading(true);
    getAllArticles()
      .then((r) => setArticles(r.data.data))
      .catch(() => setMsg('✗ 加载失败'))
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
        setMsg('✓ 文章已更新');
      } else {
        await createArticle(editing);
        setMsg('✓ 文章已发布');
      }
      setEditing(null);
      load();
    } catch {
      setMsg('✗ 保存失败，请检查后端是否运行');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确认删除这篇文章吗？')) return;
    await deleteArticle(id);
    load();
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editing) return;
    setCoverUploading(true);
    try {
      const res = await uploadFile(file);
      setEditing({ ...editing, cover_image: res.data.url });
    } catch {
      setMsg('✗ 封面图上传失败');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <PageTransition>
      <div className="dashboard">
        <div className="dashboard__header">
          <h1>文章管理</h1>
          <div className="dashboard__header-actions">
            <button
              className="btn btn--primary"
              onClick={() => setEditing({ title: '', summary: '', content: '' })}
            >
              <IconPlus size={16} stroke={2.5} />
              新建文章
            </button>
            <button className="btn btn--ghost" onClick={logout}>
              <IconLogout size={16} stroke={1.8} />
              退出
            </button>
          </div>
        </div>

        {msg && (
          <p className={`dashboard__msg ${msg.startsWith('✗') ? 'dashboard__msg--error' : 'dashboard__msg--success'}`}>
            {msg}
          </p>
        )}

        {/* 编辑器弹窗 */}
        {editing && (
          <div className="editor-backdrop" onClick={() => setEditing(null)}>
            <form className="editor-card" onSubmit={handleSave} onClick={(e) => e.stopPropagation()}>
              <div className="editor-card__header">
                <h2>{editing.id ? '编辑文章' : '新建文章'}</h2>
                <button type="button" className="editor-card__close" onClick={() => setEditing(null)}>
                  <IconX size={20} />
                </button>
              </div>

              <input
                className="editor-input"
                placeholder="文章标题 *"
                value={editing.title ?? ''}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                required
              />
              <input
                className="editor-input"
                placeholder="概要（可选）"
                value={editing.summary ?? ''}
                onChange={(e) => setEditing({ ...editing, summary: e.target.value })}
              />
              <input
                className="editor-input"
                placeholder="分类（可选，如：技术、生活）"
                value={editing.category ?? ''}
                onChange={(e) => setEditing({ ...editing, category: e.target.value })}
              />
              <input
                className="editor-input"
                placeholder='标签（可选，用英文逗号分隔，如：React,TypeScript）'
                value={
                  editing.tags
                    ? (() => {
                        try { return JSON.parse(editing.tags).join(', '); } catch { return editing.tags; }
                      })()
                    : ''
                }
                onChange={(e) => {
                  const arr = e.target.value.split(',').map((s) => s.trim()).filter(Boolean);
                  setEditing({ ...editing, tags: JSON.stringify(arr) });
                }}
              />

              <div className="editor-cover">
                <input
                  className="editor-input"
                  placeholder="封面图 URL（可输入或点击上传）"
                  value={editing.cover_image ?? ''}
                  onChange={(e) => setEditing({ ...editing, cover_image: e.target.value })}
                />
                <label className="btn btn--ghost btn--sm editor-cover__upload">
                  {coverUploading ? '上传中...' : '上传封面'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    onChange={handleCoverUpload}
                    disabled={coverUploading}
                  />
                </label>
              </div>
              {editing.cover_image && (
                <img className="editor-cover__preview" src={editing.cover_image} alt="封面预览" />
              )}

              <div className="editor-label">文章内容 *</div>
              <RichEditor
                content={editing.content ?? ''}
                onChange={(html: string) => setEditing({ ...editing, content: html })}
              />

              <div className="editor-actions">
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? '保存中...' : (editing.id ? '更新文章' : '发布文章')}
                </button>
                <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>
                  取消
                </button>
              </div>
            </form>
          </div>
        )}

        {/* 文章列表 */}
        <div className="dashboard__list">
          {loading && (
            <div className="dashboard__msg">
              <div className="dashboard__spinner" />
              加载中...
            </div>
          )}
          {!loading && articles.length === 0 && (
            <div className="dashboard__empty">
              <p>还没有文章，点击「新建文章」开始写吧！</p>
            </div>
          )}
          {articles.map((article) => (
            <div key={article.id} className="dashboard__item">
              {article.cover_image && (
                <img className="dashboard__item-cover" src={article.cover_image} alt="" />
              )}
              <div className="dashboard__item-info">
                <span className="dashboard__item-title">{article.title}</span>
                {article.summary && (
                  <span className="dashboard__item-summary">{article.summary}</span>
                )}
                <span className="dashboard__item-date">
                  {new Date(article.created_at).toLocaleDateString('zh-CN')}
                </span>
              </div>
              <div className="dashboard__item-actions">
                <button className="btn btn--ghost btn--sm" onClick={() => setEditing(article)}>
                  <IconEdit size={13} stroke={2} />
                  编辑
                </button>
                <button className="btn btn--danger btn--sm" onClick={() => handleDelete(article.id)}>
                  <IconTrash size={13} stroke={2} />
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageTransition>
  );
}
