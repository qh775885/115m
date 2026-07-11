interface PlayHistoryEntry {
  pickCode: string
  fileName: string
  currentTime: number
  duration: number
  quality: string
  updatedAt: number
}

interface HistoryDataShape {
  playHistory?: Record<string, PlayHistoryEntry>
}

const STORAGE_KEY = 'data'
const MAX_HISTORY_ENTRIES = 200

async function readHistoryData(): Promise<HistoryDataShape> {
  try {
    const result = await chrome.storage.local.get(STORAGE_KEY)
    return result[STORAGE_KEY] ? JSON.parse(result[STORAGE_KEY] as string) : {}
  }
  catch {
    return {}
  }
}

async function writeHistoryData(data: HistoryDataShape) {
  try {
    await chrome.storage.local.set({ [STORAGE_KEY]: JSON.stringify(data) })
  }
  catch {
    // storage write failed (quota exceeded or context invalidated)
  }
}

export async function getHistory(pickCode: string) {
  const data = await readHistoryData()
  return data.playHistory?.[pickCode] ?? null
}

export async function getHistoryMap() {
  const data = await readHistoryData()
  return data.playHistory ?? {}
}

export async function setHistory(entry: Omit<PlayHistoryEntry, 'updatedAt'>) {
  const data = await readHistoryData()
  if (!data.playHistory) data.playHistory = {}

  data.playHistory[entry.pickCode] = {
    ...entry,
    updatedAt: Date.now(),
  }

  const entries = Object.entries(data.playHistory)
  if (entries.length > MAX_HISTORY_ENTRIES) {
    entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt)
    data.playHistory = Object.fromEntries(entries.slice(0, MAX_HISTORY_ENTRIES))
  }

  await writeHistoryData(data)
}

export async function deleteHistory(pickCode: string) {
  const data = await readHistoryData()
  if (data.playHistory && typeof data.playHistory === 'object') {
    delete data.playHistory[pickCode]
  }
  await writeHistoryData(data)
}
