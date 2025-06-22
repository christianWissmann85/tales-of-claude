// src/utils/debugLogger.ts

// FIX: Extend the global Window interface to inform TypeScript about our custom properties.
// This is the type-safe way to add properties to the window object.
declare global {
  interface Window {
    debugLogger: DebugLogger;
    downloadDebugLog: () => void;
    showDebugLogs: () => void;
  }
}

// Simple debug logger that stores logs in memory and provides them as a downloadable file
class DebugLogger {
  private logs: string[] = [];
  private enabled = true;

  // FIX 1: Replaced 'any' with 'unknown' for better type safety.
  // 'unknown' is a safer alternative as it forces type checking, but since
  // we are only passing it to JSON.stringify, it works perfectly here.
  log(message: string, data?: unknown): void {
    if (!this.enabled) { return; }

    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;

    if (data !== undefined) {
      this.logs.push(`${logEntry}\n${JSON.stringify(data, null, 2)}`);
    } else {
      this.logs.push(logEntry);
    }

    // Don't log to console to avoid spam
  }

  getLogs(): string {
    return this.logs.join('\n\n');
  }

  downloadLogs(): void {
    const content = this.getLogs();
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'debug-log.txt';
    a.click();
    URL.revokeObjectURL(url);
  }

  clear(): void {
    this.logs = [];
  }

  // Expose to window for easy access
  exposeToWindow(): void {
    // FIX 2, 3, 4: By using 'declare global' above, we no longer need to cast 'window' to 'any'.
    // This makes the code type-safe and lets TypeScript know our custom window properties are valid.
    window.debugLogger = this;
    window.downloadDebugLog = () => this.downloadLogs();
    window.showDebugLogs = () => console.log(this.getLogs());

    // Only log this once
    setTimeout(() => {
      console.log('🔍 Debug logger ready! Commands:');
      console.log('  window.downloadDebugLog() - Download debug logs');
      console.log('  window.showDebugLogs() - Show logs in console');
    }, 1000);
  }
}

export const debugLogger = new DebugLogger();
// Expose to window immediately
debugLogger.exposeToWindow();