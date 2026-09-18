export interface QualityOption {
  label: string
  quality: number
  url: string
}

export interface AudioTrackOption {
  id: number
  label: string
}

export interface VideoPlaybackQualityLike {
  droppedVideoFrames?: number
  totalVideoFrames?: number
}
