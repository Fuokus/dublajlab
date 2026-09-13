import { useRef, useEffect } from 'react';

interface VideoPlayerProps {
  src: string;
  className?: string;
  controls?: boolean;
  autoPlay?: boolean;
  muted?: boolean;
  onTimeUpdate?: (currentTime: number) => void;
}

export default function VideoPlayer({
  src,
  className = '',
  controls = true,
  autoPlay = false,
  muted = true,
  onTimeUpdate,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !onTimeUpdate) return;

    const handleTimeUpdate = () => {
      onTimeUpdate(video.currentTime);
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    return () => video.removeEventListener('timeupdate', handleTimeUpdate);
  }, [onTimeUpdate]);

  return (
    <div className={`relative overflow-hidden rounded-xl bg-surface-800 ${className}`}>
      <video
        ref={videoRef}
        src={src}
        controls={controls}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        className="w-full h-full object-contain"
      >
        Tarayıcınız video oynatmayı desteklemiyor.
      </video>
    </div>
  );
}
