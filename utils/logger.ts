export function logInfo(msg: string): void {
  const ts = new Date().toISOString();
  console.log(`[${ts}] [INFO] ${msg}`);
}

export function logWarn(msg: string): void {
  const ts = new Date().toISOString();
  console.warn(`[${ts}] [WARN] ${msg}`);
}
