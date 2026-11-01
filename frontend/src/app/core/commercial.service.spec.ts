import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { CommercialService } from './commercial.service';
import { Product, Sale } from './models';

const products: Product[] = [
  { id: 1, name: 'Arroz 5 kg', category: 'Mercearia', price: 25.9, stock: 15, minStock: 5, sku: 'MER-001' },
  { id: 2, name: 'Feijão 1 kg', category: 'Mercearia', price: 8.5, stock: 20, minStock: 5, sku: 'MER-002' }
];

describe('CommercialService', () => {
  let service: CommercialService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(CommercialService);
    http = TestBed.inject(HttpTestingController);
    service.products.set(products.map(product => ({ ...product })));
    service.cart.set([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }]);
  });

  afterEach(() => http.verify());

  it('calcula o carrinho usando os preços carregados pela API', () => {
    expect(service.total()).toBe(77.3);
    expect(service.addToCart(1, 14)).toContain('Estoque insuficiente');
  });

  it('carrega produtos e movimentos e aceita ausência de venda', async () => {
    const loading = service.load();
    http.expectOne('/api/products').flush(products);
    http.expectOne('/api/sales/latest').flush({ error: 'Nenhuma venda encontrada.' }, { status: 404, statusText: 'Not Found' });
    http.expectOne('/api/stock/movements').flush([]);
    await loading;
    expect(service.loadError()).toBe('');
    expect(service.products()).toHaveLength(2);
    expect(service.lastSale()).toBeNull();
  });

  it('cadastra o produto retornado pela API', async () => {
    const request = service.addProduct({ name: 'Macarrão', category: 'Mercearia', price: 6.5, stock: 10 });
    const call = http.expectOne('/api/products');
    expect(call.request.method).toBe('POST');
    call.flush({ id: 3, name: 'Macarrão', category: 'Mercearia', price: 6.5, stock: 10, minStock: 5, sku: 'NOV-003' });
    expect(await request).toBeNull();
    expect(service.products()).toHaveLength(3);
  });

  it('confirma venda na API e atualiza o estoque local', async () => {
    const pending = service.confirmSale();
    const call = http.expectOne('/api/sales');
    expect(call.request.method).toBe('POST');
    expect(call.request.body.items).toEqual([{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }]);
    const sale: Sale = { id: 'VEN-123', date: '2026-11-01T12:00:00Z', total: 77.3, items: [
      { productId: 1, name: 'Arroz 5 kg', quantity: 2, unitPrice: 25.9, subtotal: 51.8 },
      { productId: 2, name: 'Feijão 1 kg', quantity: 3, unitPrice: 8.5, subtotal: 25.5 }
    ] };
    call.flush(sale);
    await Promise.resolve();
    http.expectOne('/api/products').flush(products.map(product => ({ ...product,
      stock: product.stock - (product.id === 1 ? 2 : 3) })));
    expect((await pending).sale?.id).toBe('VEN-123');
    expect(service.products().map(product => product.stock)).toEqual([13, 17]);
    expect(service.cart()).toEqual([]);
  });

  it('mantém venda confirmada mesmo se a atualização do estoque falhar', async () => {
    const pending = service.confirmSale();
    http.expectOne('/api/sales').flush({ id: 'VEN-456', date: '2026-11-01T12:00:00Z', total: 77.3,
      items: [{ productId: 1, name: 'Arroz 5 kg', quantity: 2, unitPrice: 25.9, subtotal: 51.8 },
        { productId: 2, name: 'Feijão 1 kg', quantity: 3, unitPrice: 8.5, subtotal: 25.5 }] });
    await Promise.resolve();
    http.expectOne('/api/products').flush({ error: 'Indisponível' }, { status: 503, statusText: 'Unavailable' });
    expect((await pending).sale?.id).toBe('VEN-456');
    expect(service.cart()).toEqual([]);
    expect(service.loadError()).toContain('Venda confirmada');
  });
});
