export function extend (...args) {
  return args.reduce((previous, current) => {
    if (current == null) {
      return previous
    }
    if (typeof current !== 'object') {
      return previous
    }
    for (const [key, val] of Object.entries(current)) {
      if (val === undefined) {
        continue
      }
      previous[key] = val
    }
    return previous
  }, {})
}

class AssertionFailure extends Error {}

export function assert (condition: any, message?: string): asserts condition {
  if (!condition) {
    throw new AssertionFailure(message ?? 'Assert Failed')
  }
}

export function any<T>(arr: T[], match: (T) => boolean): boolean {
  for (let item of arr) {
    if (match(item)) {
      return true
    }
  }
  return false
}
