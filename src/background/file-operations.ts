/**
 * 文件操作 handler：移动文件、删除文件、刷新列表
 */
import type {
  MsgDeleteFile,
  MsgDeleteRefreshed,
} from '../shared/messages'
import {
  deleteFileIn115Page,
  refreshListPageIn115Tab,
  removeDeletedNodeIn115Tab,
} from '../platform/115/file-actions'
import { find115TabId, query115Tabs, queryPlayerTabs } from '../platform/115/main-world'

export async function handleMoveSuccessRefresh() {
  const playerTabs = await queryPlayerTabs()
  for (const tab of playerTabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'MOVE_REFRESHED' }).catch(() => {})
    }
  }

  const allTabs = await query115Tabs()
  for (const tab of allTabs) {
    if (tab.id && !playerTabs.some(pt => pt.id === tab.id)) {
      try {
        await refreshListPageIn115Tab(tab.id)
      }
      catch (e) {
        console.warn('[115m] executeScript refresh failed:', e)
      }
    }
  }
  return { success: true }
}

export async function handleDeleteFile(
  message: MsgDeleteFile,
  sender?: chrome.runtime.MessageSender,
) {
  const tabId = await find115TabId(sender)
  if (!tabId) {
    return { ok: false, error: 'no 115.com tab found' }
  }

  const { fileId, parentId, pickCode } = message.data
  const result = await deleteFileIn115Page(tabId, { fileId, parentId }) as { ok?: boolean, error?: string } | undefined
  if (result?.ok) {
    await handleDeleteSuccessRefresh({
      type: 'DELETE_REFRESHED',
      data: { fileId, parentId, pickCode },
    })
  }
  return result ?? { ok: false, error: 'delete executeScript empty' }
}

export async function handleDeleteSuccessRefresh(message: MsgDeleteRefreshed) {
  const { fileId, parentId, pickCode } = message.data

  const playerTabs = await queryPlayerTabs()
  for (const tab of playerTabs) {
    if (tab.id) {
      chrome.tabs.sendMessage(tab.id, { type: 'DELETE_REFRESHED', data: { fileId, parentId, pickCode } }).catch(() => {})
    }
  }

  const allTabs = await query115Tabs()
  for (const tab of allTabs) {
    if (tab.id && !playerTabs.some(pt => pt.id === tab.id)) {
      chrome.tabs.sendMessage(tab.id, { type: 'DELETE_REFRESHED', data: { fileId, parentId, pickCode } }).catch(() => {})
      try {
        await removeDeletedNodeIn115Tab(tab.id, { fileId, pickCode })
      }
      catch {
        // ignore per-tab sync failures
      }
    }
  }

  return { ok: true }
}
