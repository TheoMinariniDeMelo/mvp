import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CommercialService } from '../../core/commercial.service';
import { NewSaleComponent } from './new-sale.component';

describe('NewSaleComponent', () => {
  it('limita a seleção ao estoque que ainda pode entrar no carrinho', () => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: CommercialService, useValue: { available: () => 15, inCart: () => 2 } }
      ]
    });
    const component = TestBed.runInInjectionContext(() => new NewSaleComponent());

    expect(component.remaining(1)).toBe(13);
    component.setQuantity(1, '14');
    expect(component.error()).toContain('Estoque insuficiente');
    component.stepQuantity(1, -1);
    expect(component.quantity(1)).toBe(13);
    expect(component.error()).toBe('');
  });
});
