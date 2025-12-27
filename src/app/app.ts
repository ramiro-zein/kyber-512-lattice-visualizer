import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LogService } from './services/log.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly title = signal('modelo-cifrado');
  protected readonly logService = inject(LogService);

  formatTime(date: Date): string {
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  clearLogs(): void {
    this.logService.clear();
    this.logService.info('Log limpiado');
  }
}
