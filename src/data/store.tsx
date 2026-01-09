import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { loadManifest } from './manifest'
import type { Manifest, ManifestDataset, ManifestSnapshot, WorkerResult } from './types'
import type { WorkerRequest, WorkerResponse } from '../workers/types'

type DataStatus = 'idle' | 'loading' | 'ready' | 'error' | 'custom'

type DataContextValue = {
  manifest: Manifest | null
  datasets: ManifestDataset[]
  snapshots: ManifestSnapshot[]
  activeDataset: ManifestDataset | null
  selectedDatasetId: string | null
  selectDataset: (id: string) => void
  status: DataStatus
  statusMessage: string
  error: string | null
  result: WorkerResult | null
  loadSelectedDataset: () => void
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function DataProvider({ children }: { children: ReactNode }) {
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [selectedDatasetId, setSelectedDatasetId] = useState<string | null>(null)
  const [status, setStatus] = useState<DataStatus>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<WorkerResult | null>(null)
  const workerRef = useRef<Worker | null>(null)

  useEffect(() => {
    const baseUrl = new URL('./', document.baseURI).toString()
    loadManifest(baseUrl)
      .then((data) => {
        setManifest(data)
        setSelectedDatasetId(data.datasets[0]?.id ?? null)
      })
      .catch((err: Error) => {
        setError(err.message)
        setStatus('error')
      })
  }, [])

  useEffect(() => () => workerRef.current?.terminate(), [])

  const datasets = useMemo(() => manifest?.datasets ?? [], [manifest])
  const activeDataset = useMemo(
    () => datasets.find((dataset) => dataset.id === selectedDatasetId) ?? null,
    [datasets, selectedDatasetId],
  )
  const snapshots = useMemo(
    () =>
      manifest?.snapshots.filter((snapshot) => snapshot.datasetId === selectedDatasetId) ?? [],
    [manifest, selectedDatasetId],
  )

  const selectDataset = (id: string) => {
    setSelectedDatasetId(id)
    setStatus('idle')
    setStatusMessage('')
    setError(null)
    setResult(null)
  }

  const loadSelectedDataset = () => {
    if (!activeDataset) {
      return
    }
    if (activeDataset.format === 'custom-raw') {
      setStatus('custom')
      setStatusMessage('Custom parsing not configured.')
      setError(null)
      setResult(null)
      return
    }
    if (!snapshots.length) {
      setStatus('error')
      setError('No snapshots found for this dataset.')
      setResult(null)
      return
    }

    setStatus('loading')
    setStatusMessage('Starting worker...')
    setError(null)

    workerRef.current?.terminate()
    const worker = new Worker(new URL('../workers/scanWorker.ts', import.meta.url), {
      type: 'module',
    })
    workerRef.current = worker

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const message = event.data
      if (message.type === 'progress') {
        setStatusMessage(message.message)
        return
      }
      if (message.type === 'result') {
        setResult(message.payload)
        setStatus('ready')
        setStatusMessage('Ready')
        return
      }
      if (message.type === 'error') {
        setError(message.error)
        setStatus('error')
        setStatusMessage('Error')
      }
    }

    worker.onerror = (event) => {
      setError(event.message)
      setStatus('error')
    }

    const baseUrl = new URL('./', document.baseURI).toString()
    const request: WorkerRequest = {
      type: 'process-dataset',
      datasetId: activeDataset.id,
      format: activeDataset.format,
      baseUrl,
      snapshots,
    }
    worker.postMessage(request)
  }

  const value: DataContextValue = {
    manifest,
    datasets,
    snapshots,
    activeDataset,
    selectedDatasetId,
    selectDataset,
    status,
    statusMessage,
    error,
    result,
    loadSelectedDataset,
  }

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error('useData must be used within DataProvider')
  }
  return context
}
