import type { FileItem } from '../../lib/api/types'
import { runIn115MainWorld } from './main-world'

export async function fetchVideoInfoByPickCode(tabId: number, pickCode: string) {
  return await runIn115MainWorld({
    tabId,
    args: [`https://webapi.115.com/files/video?pickcode=${pickCode}&share_id=0&local=1`],
    func: async (url: string) => {
      try {
        const res = await fetch(url, { credentials: 'include' })
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
    args: [`https://webapi.115.com/files?${params}`],
    func: async (url: string) => {
      try {
        const res = await fetch(url, { credentials: 'include' })
        return await res.json()
      }
      catch (error) {
        return { state: false, error: String(error) }
      }
    },
  })
}

export async function showMoveFileDialogIn115Page(tabId: number, payload: { fileId: string, parentId: string, cid: string }) {
  return await runIn115MainWorld({
    tabId,
    args: [payload],
    func: async (data: { fileId: string, parentId: string, cid: string }) => {
      const win = window as any

      if (!win.Core) {
        const loadScript = (url: string) => new Promise((resolve, reject) => {
          const script = document.createElement('script')
          script.src = url
          script.onload = resolve
          script.onerror = () => reject(new Error(`Failed to load ${url}`))
          document.head.appendChild(script)
        })

        try {
          await loadScript('https://cdnres.115.com/site/static/js/jquery.js?_vh=ddb84c1_91')
          await loadScript('https://cdnassets.115.com/??libs/jquery-1.7.2.js,jquery-extend.js,libs/json2.js,oofUtil.js,paths.js,oofUtil/subscribe.js,commonFrame/urlMaintain.js,ajax/bridge.js?v=1767951162')
          await loadScript('https://cdnres.115.com/site/static/js/min/util-min.js?_vh=be49060_91')
          await loadScript('https://cdnres.115.com/site/static/js/wl_disk2014/min/core-min.js?_vh=d376e38_91')

          await new Promise<void>((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Core SDK load timeout')), 10000)
            const check = () => {
              if (win.Core) { clearTimeout(timeout); resolve() }
              else setTimeout(check, 50)
            }
            check()
          })
        }
        catch (error: any) {
          return { ok: false, error: `Failed to inject Core SDK: ${error?.message || String(error)}` }
        }
      }

      const Core = win.Core
      const $ = win.$ || win.jQuery
      if (!Core?.TreeDG?.Show) {
        return { ok: false, error: 'Core.TreeDG not available after loading' }
      }

      if (!document.querySelector('link[href*="dialog_box.css"]')) {
        const link = document.createElement('link')
        link.rel = 'stylesheet'
        link.href = 'https://cdnres.115.com/site/static/style_v11.2/common/css/dialog_box.css?_vh=f17e241_91'
        document.head.appendChild(link)
      }

      if (!Core.DataAccess?.UDataAPI && $?.ajax) {
        if (!Core.DataAccess) Core.DataAccess = {}
        Core.DataAccess.UDataAPI = {
          ajax: (settings: any) => {
            let url = settings.url || ''
            if (url.startsWith('/')) url = `//webapi.115.com${url}`
            return $.ajax({ ...settings, url, xhrFields: { withCredentials: true } })
          },
        }
      }

      if (Core.FileConfig) {
        Core.FileConfig.aid = Number(data.parentId) || 0
        Core.FileConfig.cid = data.cid || '0'
      }

      const fileAttrs: Record<string, string> = {
        file_type: '1',
        file_id: data.fileId,
        cate_id: data.parentId || '',
        area_id: '0',
      }
      const mockJQueryObject = { attr: (key: string) => fileAttrs[key] || '' }

      try {
        Core.TreeDG.Show({
          list: [mockJQueryObject],
          type: 'move',
          has_dir: false,
          callback: (result: any) => {
            if (result !== false) {
              window.dispatchEvent(new CustomEvent('115m-move-success'))
              try {
                chrome.runtime.sendMessage({ type: 'MOVE_SUCCESS_REFRESH' })
              }
              catch {
                // ignore main-world runtime bridge failures
              }
            }
          },
        })
      }
      catch (error: any) {
        return { ok: false, error: `TreeDG.Show threw: ${error?.message || String(error)}` }
      }

      return { ok: true }
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
        const res = await fetch(`${location.protocol}//webapi.115.com/rb/delete`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: body.toString(),
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

export async function removeDeletedNodeIn115Tab(tabId: number, payload: { fileId: string, pickCode: string }) {
  await runIn115MainWorld({
    tabId,
    args: [payload],
    func: (data: { fileId: string, pickCode: string }) => {
      const docs: Document[] = [document]
      const frame = document.querySelector('iframe[name="wangpan"]') as HTMLIFrameElement | null
      if (frame?.contentDocument) docs.push(frame.contentDocument)

      for (const doc of docs) {
        const selector = [
          `[file_id="${data.fileId}"]`,
          `[fid="${data.fileId}"]`,
          `[fileid="${data.fileId}"]`,
          `[pick_code="${data.pickCode}"]`,
          `[pickcode="${data.pickCode}"]`,
        ].join(',')
        doc.querySelectorAll(selector).forEach((node) => node.remove())
      }
    },
  })
}
