import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { KyberVisualizationComponent } from './kyber-visualization';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, KyberVisualizationComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('CRYSTALS-Kyber 3D');
}
