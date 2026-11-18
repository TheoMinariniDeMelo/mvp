import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MockCommercialService } from './mock-commercial.service';

describe('MockCommercialService', () => {
  let service: MockCommercialService;
  const saved = new Map<string, string>();

  beforeEach(async () => {
    saved.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => saved.get(key) ?? null,
      setItem: (key: string, value: string) => { saved.set(key, value); },
      removeItem: (key: string) => { saved.delete(key); }
    });
    TestBed.configureTestingModule({ providers: [provideHttpClient(), MockCommercialService] });
    service = TestBed.inject(MockCommercialService);
    await service.load();
  });

  afterEach(() => vi.unstubAllGlobals());

  it('cadastra, vende e restaura os dados do navegador sem chamadas HTTP', async () => {
    expect(service.products()).toHaveLength(5);
    expect(service.total()).toBe(77.3);
    expect(await service.addProduct({ name: '  Macarrão ', category: 'Mercearia', price: 6.5, stock: 10 })).toBeNull();
    expect(service.products().find(product => product.name === 'Macarrão')?.stock).toBe(10);

    const result = await service.confirmSale();
    expect(result.sale?.total).toBe(77.3);
    expect(service.products().find(product => product.id === 1)?.stock).toBe(13);
    expect(service.products().find(product => product.id === 2)?.stock).toBe(17);
    expect(service.movements()).toHaveLength(2);
    expect(service.cart()).toEqual([]);

    const restored = TestBed.runInInjectionContext(() => new MockCommercialService());
    await restored.load();
    expect(restored.products()).toHaveLength(6);
    expect(restored.products().find(product => product.id === 1)?.stock).toBe(13);
    expect(restored.lastSale()?.id).toBe(result.sale?.id);
    expect(restored.movements()).toHaveLength(2);
  });

  it('recusa venda acima do estoque e mantém os dados intactos', async () => {
    service.cart.set([{ productId: 1, quantity: 16 }]);
    const result = await service.confirmSale();
    expect(result.error).toContain('Estoque insuficiente');
    expect(service.products().find(product => product.id === 1)?.stock).toBe(15);
    expect(service.lastSale()).toBeNull();
  });
});
