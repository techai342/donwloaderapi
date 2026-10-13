export interface VideoFormatOption {
  id: string;
  quality: string;
  resolution?: string;
  ext: string;
  type: 'video' | 'audio';
  filesizeText?: string;
  label: string;
  isPopular?: boolean;
}

export interface VideoInfo {
  id: string;
  title: string;
  description: string;
  duration: string;
  durationSeconds: number;
  thumbnail: string;
  author: string;
  channelUrl: string;
  viewCount: string;
  uploadDate: string;
  formats: {
    videos: VideoFormatOption[];
    audios: VideoFormatOption[];
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}
