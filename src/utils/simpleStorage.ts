import {parse, stringify} from 'devalue'

import {APP_NAME} from '@/constants/config'

import errorMessageOrUndefined from './errors/errorMessageOrUndefined'
import ErrorWithMetadata from './errors/ErrorWithMetadata'
import type {ErrorMetadata} from './logger'

// NOTE: storage can be unavailable in SSR
const localStorage: Storage | undefined = globalThis.localStorage
const sessionStorage: Storage | undefined = globalThis.sessionStorage

class SimpleStorageError extends ErrorWithMetadata {
  constructor(name: string, message?: string, metadata?: ErrorMetadata, options?: ErrorOptions) {
    super('SimpleStorageError', name, message, metadata, options)
    this.permanent()
  }
}

function generateKey(key: string) {
  return `${APP_NAME}_${key}` // prefix_key
}

export function isStorageEventOfKey(key: string, event: unknown): event is StorageEvent {
  return event instanceof StorageEvent && event.key === generateKey(key)
}

function set<T>(key: string, value: T, session?: boolean) {
  const storage = session ? sessionStorage : localStorage

  if (!storage) {
    throw new SimpleStorageError(
      'NotAvailable',
      `${session ? 'session' : 'local'} storage is not available`,
    )
  }

  try {
    const rawValue = stringify(value)
    const k = generateKey(key)
    // Dispatch a storage event for persistent, because the original storage event only dispatch when the storage is updated from another context (another tab, another window, etc.)
    const event = new StorageEvent('simpleStorage', {
      key: k,
      newValue: rawValue,
      oldValue: storage.getItem(k),
      url: window.location.href,
      storageArea: storage,
    })
    storage.setItem(k, rawValue)
    window.dispatchEvent(event)
    return value
  } catch (error) {
    throw new SimpleStorageError('Set', errorMessageOrUndefined(error), {
      value,
      error,
      isSessionStorage: !!session,
    })
  }
}

function remove(key: string, session?: boolean) {
  const storage = session ? sessionStorage : localStorage

  if (!storage) {
    throw new SimpleStorageError(
      'NotAvailable',
      `${session ? 'session' : 'local'} storage is not available`,
    )
  }

  const k = generateKey(key)
  const event = new StorageEvent('simpleStorage', {
    key: k,
    newValue: null,
    oldValue: storage.getItem(k),
    url: window.location.href,
    storageArea: storage,
  })
  storage.removeItem(k)
  window.dispatchEvent(event)
}

function get(key: string, defaultValue?: unknown, session?: boolean): unknown {
  const storage = session ? sessionStorage : localStorage

  try {
    const rawValue = storage?.getItem(generateKey(key))
    if (rawValue) {
      return parse(rawValue)
    }
  } catch {
    return defaultValue
  }
}

function clear(session?: boolean) {
  const storage = session ? sessionStorage : localStorage

  if (!storage) {
    throw new SimpleStorageError(
      'NotAvailable',
      `${session ? 'session' : 'local'} storage is not available`,
    )
  }
  try {
    storage.clear()
    const event = new StorageEvent('simpleStorage', {
      key: null,
      newValue: null,
      oldValue: null,
      url: window.location.href,
      storageArea: storage,
    })
    window.dispatchEvent(event)
  } catch (error) {
    throw new SimpleStorageError('Clear', errorMessageOrUndefined(error), {
      error,
      isSessionStorage: !!session,
    })
  }
}

const simpleStorage = {
  clear,
  get,
  set,
  remove,
}

export default simpleStorage
