import { Injectable, signal, computed } from '@angular/core';

export interface LogEntry {
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class LogService {
  private readonly _logs = signal<LogEntry[]>([]);
  private readonly maxLogs = 50;

  readonly logs = computed(() => this._logs());

  constructor() {
    this.info('Sistema inicializado');
  }

  private addLog(message: string, type: LogEntry['type']): void {
    const entry: LogEntry = {
      timestamp: new Date(),
      message,
      type
    };

    this._logs.update(logs => {
      const newLogs = [...logs, entry];
      if (newLogs.length > this.maxLogs) {
        return newLogs.slice(-this.maxLogs);
      }
      return newLogs;
    });
  }

  info(message: string): void {
    this.addLog(message, 'info');
  }

  success(message: string): void {
    this.addLog(message, 'success');
  }

  warning(message: string): void {
    this.addLog(message, 'warning');
  }

  error(message: string): void {
    this.addLog(message, 'error');
  }

  clear(): void {
    this._logs.set([]);
  }
}
