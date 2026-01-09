import type { RawToNormalizedAdapter } from '../types'
import { customAdapter } from './customAdapter'
import { demoAdapter } from './demoAdapter'

const adapters: RawToNormalizedAdapter[] = [demoAdapter, customAdapter]

export function getAdapter(format: string): RawToNormalizedAdapter | undefined {
  return adapters.find((adapter) => adapter.supportsFormat(format))
}
