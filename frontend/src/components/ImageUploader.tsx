import { useState, useCallback } from 'react';
import { IconUpload, IconX, IconPhoto } from '@tabler/icons-react';
import { uploadFile, getUploadList } from '../api';
import './ImageUploader.css';

interface Props {
  onSelect: (url: string) => void;
  onClose: () => void;
}

interface UploadedFile {
  filename: string;
  url: string;
  size: number;
}

export default function ImageUploader({ onSelect, onClose }: Props) {
  const [tab, setTab] = useState<'upload' | 'library'>('upload');
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [libLoading, setLibLoading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const res = await uploadFile(file);
      onSelect(res.data.url);
    } catch {
      alert('上传失败，请确认已登录且后端正在运行');
    } finally {
      setUploading(false);
    }
  };

  const loadLibrary = useCallback(async () => {
    setTab('library');
    setLibLoading(true);
    try {
      const res = await getUploadList();
      setFiles(res.data);
    } catch {
      setFiles([]);
    } finally {
      setLibLoading(false);
    }
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  const isImage = (filename: string) => /\.(jpe?g|png|gif|webp|svg)$/i.test(filename);

  return (
    <div className="img-uploader-backdrop" onClick={onClose}>
      <div className="img-uploader" onClick={(e) => e.stopPropagation()}>
        {/* Tabs */}
        <div className="img-uploader__tabs">
          <button
            className={tab === 'upload' ? 'active' : ''}
            onClick={() => setTab('upload')}
          >
            <IconUpload size={14} stroke={2} />
            上传图片
          </button>
          <button
            className={tab === 'library' ? 'active' : ''}
            onClick={loadLibrary}
          >
            <IconPhoto size={14} stroke={2} />
            图片库
          </button>
          <button className="img-uploader__close" onClick={onClose}>
            <IconX size={18} />
          </button>
        </div>

        {/* 上传 Tab */}
        {tab === 'upload' && (
          <div
            className={`img-uploader__dropzone${dragging ? ' dragging' : ''}${uploading ? ' uploading' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            {uploading ? (
              <div className="img-uploader__spinner" />
            ) : (
              <>
                <IconUpload size={36} stroke={1.2} className="img-uploader__icon" />
                <p>将图片拖到这里，或</p>
                <label className="btn btn--primary btn--sm">
                  选择文件
                  <input
                    type="file"
                    accept="image/*,video/mp4,video/webm"
                    hidden
                    onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
                  />
                </label>
                <p className="img-uploader__hint">支持 JPG、PNG、GIF、WebP，最大 100MB</p>
              </>
            )}
          </div>
        )}

        {/* 图片库 Tab */}
        {tab === 'library' && (
          <div className="img-uploader__library">
            {libLoading && <div className="img-uploader__spinner img-uploader__spinner--center" />}
            {!libLoading && files.length === 0 && (
              <p className="img-uploader__empty">暂无图片，先切换到「上传图片」添加一些吧</p>
            )}
            <div className="img-uploader__grid">
              {files.filter((f) => isImage(f.filename)).map((f) => (
                <button
                  key={f.filename}
                  className="img-uploader__item"
                  onClick={() => onSelect(f.url)}
                  title={f.filename}
                >
                  <img src={f.url} alt={f.filename} loading="lazy" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
