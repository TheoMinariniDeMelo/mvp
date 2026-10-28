import { CommercialService } from './commercial.service';

describe('CommercialService', () => {
  it('rejeita preço que seria arredondado para zero', () => {
    const service = new CommercialService();
    expect(service.addProduct({ name: 'Teste', category: 'Outros', price: 0.001, stock: 1 })).toBeTruthy();
  });

  it('evita produtos duplicados mesmo com diferenças de maiúsculas', () => {
    const service = new CommercialService();
    expect(service.addProduct({ name: ' arroz 5 KG ', category: 'Mercearia', price: 10, stock: 1 })).toBe('Já existe um produto com esse nome.');
  });

  it('calcula a venda de exemplo com precisão', () => {
    const service = new CommercialService();
    expect(service.cartItems().map(item => item.subtotal)).toEqual([51.8, 25.5]);
    expect(service.total()).toBe(77.3);
  });

  it('impede quantidades acima do estoque ao adicionar e confirmar', () => {
    const service = new CommercialService();
    expect(service.addToCart(1, 14)).toBe('Estoque insuficiente. Verifique a quantidade selecionada.');
    expect(service.updateCart(1, 16)).toBe('Estoque insuficiente. Verifique a quantidade selecionada.');
    expect(service.products().find(p => p.id === 1)?.stock).toBe(15);
  });

  it('permite adicionar, alterar e remover itens no carrinho', () => {
    const service = new CommercialService();
    expect(service.addToCart(3, 2)).toBeNull();
    expect(service.total()).toBe(87.1);
    expect(service.updateCart(3, 3)).toBeNull();
    expect(service.total()).toBe(92);
    service.removeFromCart(3);
    expect(service.total()).toBe(77.3);
  });

  it('não altera uma linha ausente do carrinho', () => {
    const service = new CommercialService();
    expect(service.updateCart(3, 2)).toBe('Produto não encontrado no carrinho.');
    expect(service.inCart(3)).toBe(0);
  });

  it('rejeita a confirmação se o estoque mudar antes da venda', () => {
    const service = new CommercialService();
    service.products.update(list => list.map(p => p.id === 1 ? { ...p, stock: 1 } : p));
    expect(service.confirmSale().error).toBe('Estoque insuficiente. Verifique a quantidade selecionada.');
    expect(service.products().find(p => p.id === 1)?.stock).toBe(1);
  });

  it('rejeita linhas duplicadas para não registrar venda inconsistente', () => {
    const service = new CommercialService();
    service.cart.set([{ productId: 1, quantity: 2 }, { productId: 1, quantity: 2 }]);
    expect(service.confirmSale().error).toBe('O carrinho contém produtos duplicados. Revise a venda.');
    expect(service.available(1)).toBe(15);
  });

  it('confirma a venda e atualiza o estoque sem saldo negativo', () => {
    const service = new CommercialService();
    const result = service.confirmSale();
    expect(result.sale?.total).toBe(77.3);
    expect(result.sale?.items.map(item => item.quantity)).toEqual([2, 3]);
    expect(service.products().find(p => p.id === 1)?.stock).toBe(13);
    expect(service.products().find(p => p.id === 2)?.stock).toBe(17);
    expect(service.cart()).toEqual([]);
    expect(service.movements()).toHaveLength(2);
  });
});
