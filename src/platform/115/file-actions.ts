import type { FileItem } from '../../lib/api/types'
import { runIn115MainWorld } from './main-world'

export async function fetchVideoInfoByPickCode(tabId: number, pickCode: string) {
  return await runIn115MainWorld({
    tabId,
    args: [`https://webapi.115.com/files/video?pickcode=${pickCode}&share_id=0&local=1`, 15_000],
    func: async (url: string, fetchTimeoutMs: number) => {
      try {
        const signal = typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function'
          ? (AbortSignal as any).timeout(fetchTimeoutMs)
          : undefined
        const res = await fetch(url, { credentials: 'include', signal })
        return await res.json()
      }
      catch (error) {
        return { state: false, error: String(error) }
      }
    },
  })
}

export async function fetchPlaylistIn115Page(tabId: number, cid: string): Promise<{ state?: boolean, data?: FileItem[], path?: Array<{ cid: string, name: string }>, error?: string } | undefined> {
  const params = new URLSearchParams({
    aid: '1', cid, offset: '0', limit: '1150',
    show_dir: '0', nf: '', qid: '0', type: '4',
    source: '', format: 'json', star: '', is_q: '',
    is_share: '', r_all: '1', o: 'file_name',
    asc: '1', cur: '1', natsort: '1',
  })

  return await runIn115MainWorld({
    tabId,
    args: [`https://webapi.115.com/files?${params}`, 15_000],
    func: async (url: string, fetchTimeoutMs: number) => {
      try {
        const signal = typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function'
          ? (AbortSignal as any).timeout(fetchTimeoutMs)
          : undefined
        const res = await fetch(url, { credentials: 'include', signal })
        return await res.json()
      }
      catch (error) {
        return { state: false, error: String(error) }
      }
    },
  })
}

export async function deleteFileIn115Page(tabId: number, payload: { fileId: string, parentId: string }) {
  return await runIn115MainWorld({
    tabId,
    args: [payload],
    func: async (data: { fileId: string, parentId: string }) => {
      try {
        const body = new URLSearchParams({
          pid: data.parentId,
          'fid[0]': data.fileId,
        })
        const signal = typeof AbortSignal !== 'undefined' && typeof (AbortSignal as any).timeout === 'function'
          ? (AbortSignal as any).timeout(15_000)
          : undefined
        const res = await fetch(`${location.protocol}//webapi.115.com/rb/delete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
          signal,
        })
        const text = await res.text()
        const parsed = text ? JSON.parse(text) : null
        return {
          ok: !!parsed?.state,
          error: parsed?.error || parsed?.message || (!res.ok ? `HTTP ${res.status}` : ''),
        }
      }
      catch (error) {
        return { ok: false, error: String(error) }
      }
    },
  })
}

export async function refreshListPageIn115Tab(tabId: number) {
  await runIn115MainWorld({
    tabId,
    args: [],
    func: () => {
      try {
        const frame = document.querySelector('iframe[name="wangpan"]') as HTMLIFrameElement | null
        const win = frame ? (frame.contentWindow as any) : (window as any)
        if (win?.Core?.FileConfig?.DataAPI?.Refresh) {
          win.Core.FileConfig.DataAPI.Refresh()
        }
        else if ((window as any).Core?.FileConfig?.DataAPI?.Refresh) {
          ;(window as any).Core.FileConfig.DataAPI.Refresh()
        }
      }
      catch {
        // ignore per-tab refresh failures
      }
    },
  })
}
