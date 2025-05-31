import {captureException, captureMessage, setContext, type SeverityLevel} from '@sentry/react'
import {stringify} from 'devalue'

import {isUserFriendlyError} from './errors/UserFriendlyError'
import isObjectDepthExceed from './isObjectDepthExceed'

export type ErrorMetadata = Record<Exclude<string, 'type' | 'TYPE'>, unknown>

const logError = function (
  err: unknown,
  extra?: Record<Exclude<string, 'type' | 'TYPE'>, unknown>,
  hint?: Record<string, unknown>,
) {
  // If the error is a UserFriendlyError, the cause should be logged, not the error itself.
  const error = isUserFriendlyError(err) ? err.cause : err

  console.error(error)
  if (extra) console.info('Extra:', extra)
  if (hint) console.info('Hint:', hint)

  // Log metadata of the error

  // @ts-expect-error error can be anything
  if (typeof error === 'object' && 'metadata' in error) {
    ;(function logMetadata() {
      const depthExceeded = isObjectDepthExceed(error.metadata, 3)

      if (!depthExceeded) {
        try {
          // @ts-expect-error optimistically set metadata for the error
          setContext('metadata', error.metadata)
          return
        } catch {
          /* empty */
        }
      }

      let serializedMetadata

      try {
        serializedMetadata = stringify(error.metadata, {
          Function: value => value instanceof Function && (value as () => unknown).toString(),
        })
      } catch {
        /* empty */
      }

      if (serializedMetadata) {
        setContext('metadata', {serializedMetadata})
        return
      }

      console.log('[metadata]', error.metadata)
    })()
  }

  if (extra) setContext('extra', extra)

  captureException(error, hint)
}

const logMessage = function (
  message: string,
  extra?: Record<Exclude<string, 'type' | 'TYPE'>, unknown>,
  level: SeverityLevel = 'debug',
) {
  console.debug(message)
  if (extra) setContext('extra', extra)
  captureMessage(message, {level})
}

const logEvent = function (
  eventName: Gtag.EventNames | (string & NonNullable<unknown>),
  eventParams?: Gtag.ControlParams | Gtag.EventParams | Gtag.CustomParams,
) {
  try {
    window.gtag('event', eventName, eventParams)
  } catch {
    console.error('Cannot log event', eventName, eventParams)
    /* empty */
  }
}

export {logError, logEvent, logMessage}
