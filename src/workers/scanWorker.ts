import { computeDataset } from '../data/compute'
import { getAdapter } from '../data/normalization'
import type { ManifestSnapshot, NormalizedSnapshot } from '../data/types'
import type { WorkerRequest, WorkerResponse } from './types'

const ctx: DedicatedWorkerGlobalScope = self as DedicatedWorkerGlobalScope

const postProgress = (message: string) => {
  ctx.postMessage({ type: 'progress', message } satisfies WorkerResponse)
}

ctx.onmessage = async (event: MessageEvent<WorkerRequest>) => {
  if (event.data.type !== 'process-dataset') {
    return
  }

  const { snapshots, format, baseUrl, datasetId } = event.data
  try {
    const adapter = getAdapter(format)
    if (!adapter) {
      throw new Error(`No adapter found for format ${format}`)
    }

    postProgress('Loading snapshots...')
    const normalized: NormalizedSnapshot[] = []
    for (const snapshot of snapshots) {
      postProgress(`Fetching ${snapshot.label}`)
      const url = new URL(snapshot.path, baseUrl).toString()
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Snapshot fetch failed (${snapshot.id})`)
      }
      const raw = (await response.json()) as unknown
      const parsed = adapter.normalize(raw, snapshot)
      normalized.push(parsed)
    }

    postProgress('Computing metrics...')
    const result = computeDataset(normalized, snapshots, datasetId)
    ctx.postMessage({ type: 'result', datasetId, payload: result } satisfies WorkerResponse)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown worker error'
    ctx.postMessage({ type: 'error', error: message } satisfies WorkerResponse)
  }
}
