import ReactPlayer from 'react-player';
import './VideoPlayer.css';

interface Props {
  url: string;
  title?: string;
}

export default function VideoPlayer({ url, title }: Props) {
  return (
    <div className="video-player">
      {title && <p className="video-player__title">{title}</p>}
      <div className="video-player__wrapper">
        <ReactPlayer
          src={url}
          controls
          width="100%"
          height="100%"
        />
      </div>
    </div>
  );
}
