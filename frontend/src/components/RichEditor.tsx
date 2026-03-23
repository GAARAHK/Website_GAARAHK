import { useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import ImageUploader from './ImageUploader';
import './RichEditor.css';

interface Props {
  content: string;
  onChange: (html: string) => void;
}

export default function RichEditor({ content, onChange }: Props) {
  const [showUploader, setShowUploader] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ allowBase64: false, inline: false }),
      Link.configure({ openOnClick: false }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
  });

  if (!editor) return null;

  const toolbar = [
    {
      label: <strong>B</strong>,
      title: '粗体 (Ctrl+B)',
      action: () => editor.chain().focus().toggleBold().run(),
      active: editor.isActive('bold'),
    },
    {
      label: <em>I</em>,
      title: '斜体 (Ctrl+I)',
      action: () => editor.chain().focus().toggleItalic().run(),
      active: editor.isActive('italic'),
    },
    {
      label: '代码',
      title: '行内代码',
      action: () => editor.chain().focus().toggleCode().run(),
      active: editor.isActive('code'),
    },
  ];

  return (
    <div className="rich-editor">
      <div className="rich-editor__toolbar">
        {toolbar.map((item, i) => (
          <button
            key={i}
            type="button"
            title={item.title}
            className={item.active ? 'active' : ''}
            onClick={item.action}
          >
            {item.label}
          </button>
        ))}
        <div className="rich-editor__sep" />
        <button
          type="button"
          className={editor.isActive('heading', { level: 2 }) ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >H2</button>
        <button
          type="button"
          className={editor.isActive('heading', { level: 3 }) ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >H3</button>
        <div className="rich-editor__sep" />
        <button
          type="button"
          className={editor.isActive('bulletList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >• 列表</button>
        <button
          type="button"
          className={editor.isActive('orderedList') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >1. 列表</button>
        <button
          type="button"
          className={editor.isActive('blockquote') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >引用</button>
        <button
          type="button"
          className={editor.isActive('codeBlock') ? 'active' : ''}
          onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        >代码块</button>
        <div className="rich-editor__sep" />
        <button type="button" title="插入图片" onClick={() => setShowUploader(true)}>
          🖼 图片
        </button>
        <button
          type="button"
          title="插入视频"
          onClick={() => {
            const url = prompt('视频链接（支持本地 MP4、YouTube、Bilibili 等）');
            if (!url) return;
            const title = prompt('视频标题（可选，留空跳过）') ?? '';
            const tag = title.trim() ? `[video:${url}|${title.trim()}]` : `[video:${url}]`;
            editor.chain().focus().insertContent(tag).run();
          }}
        >
          ▶ 视频
        </button>
      </div>

      <EditorContent editor={editor} className="rich-editor__content" />

      {showUploader && (
        <ImageUploader
          onSelect={(url: string) => {
            editor.chain().focus().setImage({ src: url }).run();
            setShowUploader(false);
          }}
          onClose={() => setShowUploader(false)}
        />
      )}
    </div>
  );
}
