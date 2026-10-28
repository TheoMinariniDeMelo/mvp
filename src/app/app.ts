import { Component, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { IconComponent } from './shared/icon.component';

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent], templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  readonly exitMessage = signal('');
  showExitMessage(): void { this.exitMessage.set('Este é um ambiente de demonstração. Não há sessão ativa para encerrar.'); }
}
