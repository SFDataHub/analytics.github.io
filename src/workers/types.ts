import type { ManifestSnapshot, WorkerResult } from '../data/types'

export type WorkerRequest = {
  type: 'process-dataset'
  datasetId: string
  format: string
  baseUrl: string
  snapshots: ManifestSnapshot[]
}

export type WorkerProgress = {
  type: 'progress'
  message: string
}

export type WorkerResultMessage = {
  type: 'result'
  datasetId: string
  payload: WorkerResult
}

export type WorkerError = {
  type: 'error'
  error: string
}

export type WorkerResponse = WorkerProgress | WorkerResultMessage | WorkerError
