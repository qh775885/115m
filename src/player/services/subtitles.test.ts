import { describe, expect, it } from 'vitest'
import { findCueAt, normalizeSubtitleList, normalizeSubtitleType, parseAssSubtitle, parseSrtSubtitle, parseSubSubtitle, parseSubtitleTime, parseVttSubtitle, readSubtitleType } from './subtitles'

describe('subtitles', () => {
  it('normalizes subtitle list response', () => {
    expect(normalizeSubtitleList({
      data: [
        { sid: 'a', title: '[内置字幕]简体中文', url: 'https://example.com/0.srt', type: 'srt' },
        { sid: '', title: 'bad', url: '', type: 'srt' },
      ],
    })).toEqual([
      { sid: 'a', title: '[内置字幕]简体中文', url: 'https://example.com/0.srt', type: 'srt', language: undefined, sha1: undefined },
    ])
  })

  it('reads subtitle type from URL', () => {
    expect(readSubtitleType('https://example.com/subtitle/0.srt?token=1')).toBe('srt')
    expect(readSubtitleType('https://example.com/subtitle/1.ass')).toBe('ass')
  })

  it('parses subtitle time', () => {
    expect(parseSubtitleTime('01:02:03,456')).toBe(3723.456)
    expect(parseSubtitleTime('0:00:01.5')).toBe(1.5)
  })

  it('parses srt subtitle cues', () => {
    expect(parseSrtSubtitle(`1\n00:00:01,000 --> 00:00:03,500\n第一行\n第二行\n\n2\n00:00:04.000 --> 00:00:05.000\n<i>第三行</i>`)).toEqual([
      { start: 1, end: 3.5, text: '第一行\n第二行' },
      { start: 4, end: 5, text: '第三行' },
    ])
  })

  it('parses ass subtitle cues as plain text', () => {
    expect(parseAssSubtitle(`[Events]\nFormat: Layer, Start, End, Style, Text\nDialogue: 0,0:00:01.00,0:00:02.50,Default,{\\an8}你好\\N世界`)).toEqual([
      { start: 1, end: 2.5, text: '你好\n世界' },
    ])
  })

  it('parses vtt subtitle cues', () => {
    expect(parseVttSubtitle(`WEBVTT\n\n1\n00:00:01.000 --> 00:00:03.500 align:start position:0%\n第一行\n第二行`)).toEqual([
      { start: 1, end: 3.5, text: '第一行\n第二行' },
    ])
  })

  it('parses microdvd sub subtitle cues', () => {
    expect(parseSubSubtitle(`{24}{48}第一行|第二行`, 24)).toEqual([
      { start: 1, end: 2, text: '第一行\n第二行' },
    ])
  })

  it('normalizes subtitle type from explicit type and text', () => {
    expect(normalizeSubtitleType('webvtt')).toBe('vtt')
    expect(normalizeSubtitleType('', 'WEBVTT\n\n00:00:01.000 --> 00:00:02.000\nHello')).toBe('vtt')
    expect(normalizeSubtitleType('', '{24}{48}Hello')).toBe('sub')
  })

  it('finds cue at current time', () => {
    const cues = [
      { start: 1, end: 2, text: 'a' },
      { start: 3, end: 4, text: 'b' },
    ]
    expect(findCueAt(cues, 1.5)?.text).toBe('a')
    expect(findCueAt(cues, 2.5)).toBeNull()
  })
})
