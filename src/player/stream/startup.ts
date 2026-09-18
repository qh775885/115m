import type { M3u8Item } from '../../lib/types'
import { getQualityDisplayName } from './quality'
import type { QualityPreference } from '../services/history'

export interface InitialPlaybackPlan {
  url: string
  type: 'native' | 'hls'
  currentQuality: number
  currentQualityLabel: string
  isNativeVideo: boolean
}

export function resolveInitialPlayback(params: {
  qualityPreference: QualityPreference | null
  ultraUrl: string | null
  canUseNativeUltraSource?: boolean
  m3u8List: M3u8Item[]
}): InitialPlaybackPlan | null {
  const { qualityPreference, ultraUrl, canUseNativeUltraSource = true, m3u8List } = params
  const canUseRememberedNativeUltra = qualityPreference?.label === '无损' && !!ultraUrl
  const playableUltraUrl = canUseNativeUltraSource || canUseRememberedNativeUltra ? ultraUrl : null

  if (qualityPreference) {
    if (qualityPreference.label === '无损' && playableUltraUrl) {
      return {
        url: playableUltraUrl,
        type: 'native',
        currentQuality: 9999,
        currentQualityLabel: '无损',
        isNativeVideo: true,
      }
    }

    const preferredItem = qualityPreference.label === '115原画'
      ? m3u8List.find(item => item.quality === 9999) || m3u8List[0]
      : m3u8List.find(item => item.quality === qualityPreference.quality)

    if (preferredItem) {
      const preferredLabel = qualityPreference.label === '无损' && !playableUltraUrl
        ? getQualityDisplayName(preferredItem.quality, true)
        : qualityPreference.label

      return {
        url: preferredItem.url,
        type: 'hls',
        currentQuality: preferredItem.quality,
        currentQualityLabel: preferredLabel,
        isNativeVideo: false,
      }
    }
  }

  if (playableUltraUrl) {
    return {
      url: playableUltraUrl,
      type: 'native',
      currentQuality: 9999,
      currentQualityLabel: '无损',
      isNativeVideo: true,
    }
  }

  const bestQuality = m3u8List[0]
  if (bestQuality) {
    return {
      url: bestQuality.url,
      type: 'hls',
      currentQuality: bestQuality.quality,
      currentQualityLabel: getQualityDisplayName(bestQuality.quality, true),
      isNativeVideo: false,
    }
  }

  return null
}
