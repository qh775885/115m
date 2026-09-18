/**
 * 115m 2.0 · 字幕业务适配层（Layer 1）
 * 拉取字幕列表与字幕文本，文本解析复用 core 的纯逻辑解析器。
 */

import { fetchSubtitleList, fetchSubtitleText, parseSubtitleText, type SubtitleCue, type SubtitleItem } from '../services/subtitles'
import { callExtensionBridge } from '../runtime/bridge-client'

const bridgeSender = (message: unknown) => callExtensionBridge(message)

export async function loadSubtitleList(pickCode: string): Promise<SubtitleItem[]> {
  return await fetchSubtitleList(bridgeSender as never, pickCode)
}

export async function loadSubtitleCues(item: SubtitleItem): Promise<SubtitleCue[]> {
  const text = await fetchSubtitleText(item.url)
  return parseSubtitleText(text, item.type)
}
