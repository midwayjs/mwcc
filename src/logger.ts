export function warning(message: string, ...args) {
  console.warn(`[mwcc] warn: ${message}`, ...args);
}

export function info(message: string, ...args) {
  console.warn(`[mwcc] info: ${message}`, ...args);
}
