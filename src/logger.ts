export function warning(message: string, ...args) {
  console.warn(`[mwcc] warn: ${message}`, ...args);
}
