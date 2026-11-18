import { Component, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { IconComponent } from './shared/icon.component';
import { CommercialService } from './core/commercial.service';

@Component({ selector: 'app-root', standalone: true, imports: [RouterOutlet, RouterLink, RouterLinkActive, IconComponent], templateUrl: './app.html', styleUrl: './app.css' })
export class App {
  readonly store = inject(CommercialService);
  private readonly router = inject(Router);
  readonly exitMessage = signal('');
  constructor() {
    void this.store.load();
    this.router.events.pipe(filter(event => event instanceof NavigationEnd)).subscribe(() => {
      setTimeout(() => {
        const heading = document.querySelector<HTMLElement>('#conteudo .inner-heading h2')
          ?? document.querySelector<HTMLElement>('#conteudo h1');
        if (heading) { heading.tabIndex = -1; heading.focus(); }
      });
    });
  }
  showExitMessage(): void { this.exitMessage.set('Este é um ambiente de demonstração. Não há sessão ativa para encerrar.'); }
}
