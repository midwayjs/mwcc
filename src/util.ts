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
