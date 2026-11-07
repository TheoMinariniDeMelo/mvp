import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { App } from './app';
import { CommercialService } from './core/commercial.service';

@Component({ standalone: true, template: '<h1>Página de teste</h1>' })
class TestPage { }

describe('Navegação acessível', () => {
  it('oferece atalho ao conteúdo e move o foco para o título após navegar', async () => {
    TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([{ path: 'teste', component: TestPage }]),
        { provide: CommercialService, useValue: { load: async () => {}, loadError: signal('') } }
      ]
    });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.skip-link')?.getAttribute('href')).toBe('#conteudo');

    await TestBed.inject(Router).navigateByUrl('/teste');
    fixture.detectChanges();
    await new Promise(resolve => setTimeout(resolve, 0));

    expect(document.activeElement?.textContent).toBe('Página de teste');
  });
});
