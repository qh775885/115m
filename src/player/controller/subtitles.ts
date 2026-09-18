/**
 * 115m 2.0 · 字幕控制器（Layer 2）
 * 持有已解析的字幕 cue，按播放时间取当前字幕文本。纯逻辑，不碰 DOM。
 */

import { findCueAt, type SubtitleCue } from '../services/subtitles'

export class SubtitleController {
  private cues: SubtitleCue[] = []

  setCues(cues: SubtitleCue[]): void {
    this.cues = cues
  }

  clear(): void {
    this.cues = []
  }

  get hasCues(): boolean {
    return this.cues.length > 0
  }

  /** 返回指定时间点应显示的字幕文本（无则空串）。 */
  getTextAt(time: number): string {
    if (this.cues.length === 0) return ''
    return findCueAt(this.cues, time)?.text ?? ''
  }
}
