import { sendRuntimeMessageSafe } from './runtime'

export interface FolderItem {
  cid: string
  name: string
  pid: string
}

export interface BreadcrumbItem {
  cid: string
  name: string
}

interface FolderApiItem {
  cid?: string | number
  n?: string
  pid?: string | number
  parent_id?: string | number
  sha?: string
  ico?: string
}

interface FolderPathApiItem {
  cid?: string | number
  name?: string
}

function mapFolderItem(item: FolderApiItem, fallbackPid: string): FolderItem {
  return {
    cid: String(item.cid ?? ''),
    name: item.n || '',
    pid: String(item.pid ?? item.parent_id ?? fallbackPid),
  }
}

export interface FetchFoldersResult {
  folders: FolderItem[]
  path: BreadcrumbItem[]
  error?: string
}

export async function apiFetchFolders(cid: string): Promise<FetchFoldersResult> {
  const params = new URLSearchParams({
    aid: '1', cid, offset: '0', limit: '500',
    show_dir: '1', qid: '0', type: '0',
    source: '', format: 'json', star: '', is_q: '',
    is_share: '', o: 'file_name', asc: '1', cur: '1',
    natsort: '1',
  })
  const url = `https://webapi.115.com/files?${params}`

  const res = await sendRuntimeMessageSafe<{ ok: boolean, text: string }>({
    type: 'MAIN_WORLD_GET',
    data: { url },
  })

  if (!res?.ok || !res.text) return { folders: [], path: [], error: '网络请求失败' }

  try {
    const json = JSON.parse(res.text) as { state?: boolean, data?: FolderApiItem[], path?: FolderPathApiItem[] }
    if (!json.state) return { folders: [], path: [], error: '接口返回异常' }

    const folders = (json.data ?? [])
      .filter(item => item.cid !== undefined && !item.sha && !item.ico)
      .map(item => mapFolderItem(item, cid))

    const path = (json.path ?? []).map(item => ({
      cid: String(item.cid ?? ''),
      name: item.name || '',
    }))

    return { folders, path }
  }
  catch {
    return { folders: [], path: [], error: '解析返回数据失败' }
  }
}

export async function apiCreateFolder(parentCid: string, name: string): Promise<{ ok: boolean, cid?: string, error?: string }> {
  const body = `pid=${encodeURIComponent(parentCid)}&cname=${encodeURIComponent(name)}`
  const res = await sendRuntimeMessageSafe<{ ok: boolean, text: string }>({
    type: 'MAIN_WORLD_FETCH',
    data: { url: 'https://webapi.115.com/files/add', body },
  })

  if (!res?.ok || !res.text) return { ok: false, error: '网络请求失败' }

  try {
    const json = JSON.parse(res.text) as { state?: boolean, cid?: string | number, file_id?: string | number, error?: string }
    if (json.state) {
      return { ok: true, cid: String(json.cid || json.file_id || '') }
    }
    return { ok: false, error: json.error || '创建失败' }
  }
  catch {
    return { ok: false, error: '解析返回数据失败' }
  }
}

export async function apiMoveFile(fileId: string, targetCid: string): Promise<{ ok: boolean, error?: string }> {
  const body = `pid=${encodeURIComponent(targetCid)}&fid[0]=${encodeURIComponent(fileId)}&move_proid=`
  const res = await sendRuntimeMessageSafe<{ ok: boolean, text: string }>({
    type: 'MAIN_WORLD_FETCH',
    data: { url: 'https://webapi.115.com/files/move', body },
  })

  if (!res?.ok || !res.text) return { ok: false, error: '网络请求失败' }

  try {
    const json = JSON.parse(res.text) as { state?: boolean, error?: string, error_msg?: string }
    if (json.state) return { ok: true }
    return { ok: false, error: json.error || json.error_msg || '移动失败' }
  }
  catch {
    return { ok: false, error: '解析返回数据失败' }
  }
}

export async function apiSearchFolders(keyword: string): Promise<FolderItem[]> {
  const params = new URLSearchParams({
    aid: '1', offset: '0', limit: '50',
    search_value: keyword, format: 'json',
    fc: '1',
  })
  const url = `https://webapi.115.com/files/search?${params}`

  const res = await sendRuntimeMessageSafe<{ ok: boolean, text: string }>({
    type: 'MAIN_WORLD_GET',
    data: { url },
  })

  if (!res?.ok || !res.text) return []

  try {
    const json = JSON.parse(res.text) as { state?: boolean, data?: FolderApiItem[] }
    if (!json.state) return []
    return (json.data ?? []).map(item => mapFolderItem(item, '0'))
  }
  catch {
    return []
  }
}
