import {type} from 'arktype'

import ErrorWithMetadata from './ErrorWithMetadata'

export default class ParseError extends ErrorWithMetadata {
  constructor(name: string, message: string, errors: type.errors) {
    super('ParseError', name, message, {errors})
    this.permanent()
  }
}

export function isParseError(e: unknown): e is ParseError {
  return e instanceof ParseError
}
