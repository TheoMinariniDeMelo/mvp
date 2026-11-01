import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CartLine, Product, Sale, SaleItem, StockMovement } from './models';

const CART_KEY = 'gestao-comercial-cart-v2';
const INITIAL_CART: CartLine[] = [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }];

@Injectable({ providedIn: 'root' })
export class CommercialService {
  private readonly http = inject(HttpClient);
  readonly products = signal<Product[]>([]);
  readonly cart = signal<CartLine[]>(this.readCart());
  readonly lastSale = signal<Sale | null>(null);
  readonly movements = signal<StockMovement[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal('');
  readonly cartItems = computed<SaleItem[]>(() => this.cart().flatMap(line => {
    const product = this.products().find(p => p.id === line.productId);
    return product ? [{ productId: product.id, name: product.name, quantity: line.quantity,
      unitPrice: product.price, subtotal: this.round(product.price * line.quantity) }] : [];
  }));
  readonly total = computed(() => this.round(this.cartItems().reduce((sum, item) => sum + item.subtotal, 0)));
  readonly stockCount = computed(() => this.products().reduce((sum, p) => sum + p.stock, 0));
  readonly lowStockCount = computed(() => this.products().filter(p => p.stock <= p.minStock).length);

  async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const [products, lastSale, movements] = await Promise.all([
        firstValueFrom(this.http.get<Product[]>('/api/products')),
        firstValueFrom(this.http.get<Sale>('/api/sales/latest')).catch(error => {
          if (error instanceof HttpErrorResponse && error.status === 404) return null;
          throw error;
        }),
        firstValueFrom(this.http.get<StockMovement[]>('/api/stock/movements'))
      ]);
      this.products.set(products);
      const knownProducts = new Set(products.map(product => product.id));
      this.cart.update(lines => lines.filter(line => knownProducts.has(line.productId)));
      this.persistCart();
      this.lastSale.set(lastSale);
      this.movements.set(movements);
    } catch {
      this.loadError.set('Não foi possível conectar à API. Verifique se o backend está em execução e recarregue a página.');
    } finally {
      this.loading.set(false);
    }
  }

  private round(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
  private readCart(): CartLine[] {
    try {
      const value = localStorage.getItem(CART_KEY);
      if (value === null) return INITIAL_CART.map(line => ({ ...line }));
      const parsed: unknown = JSON.parse(value);
      if (!Array.isArray(parsed) || !parsed.every(line =>
        line !== null && typeof line === 'object' && Number.isSafeInteger(line.productId)
        && Number.isSafeInteger(line.quantity) && line.quantity > 0)) return [];
      return parsed as CartLine[];
    } catch { return INITIAL_CART.map(line => ({ ...line })); }
  }
  private persistCart(): void {
    try { localStorage.setItem(CART_KEY, JSON.stringify(this.cart())); } catch { /* Carrinho disponível nesta sessão. */ }
  }
  private apiError(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse && typeof error.error?.error === 'string') return error.error.error;
    return fallback;
  }
  available(productId: number): number { return this.products().find(p => p.id === productId)?.stock ?? 0; }
  inCart(productId: number): number { return this.cart().find(p => p.productId === productId)?.quantity ?? 0; }
  addToCart(productId: number, quantity: number): string | null {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return 'Informe uma quantidade válida.';
    const product = this.products().find(p => p.id === productId);
    if (!product) return 'Produto não encontrado.';
    if (this.inCart(productId) + quantity > product.stock) return 'Estoque insuficiente. Verifique a quantidade selecionada.';
    this.cart.update(lines => lines.some(p => p.productId === productId)
      ? lines.map(p => p.productId === productId ? { ...p, quantity: p.quantity + quantity } : p)
      : [...lines, { productId, quantity }]);
    this.persistCart(); return null;
  }
  updateCart(productId: number, quantity: number): string | null {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return 'A quantidade deve ser maior que zero. Use Remover para excluir o item.';
    if (!this.cart().some(line => line.productId === productId)) return 'Produto não encontrado no carrinho.';
    if (quantity > this.available(productId)) return 'Estoque insuficiente. Verifique a quantidade selecionada.';
    this.cart.update(lines => lines.map(p => p.productId === productId ? { ...p, quantity } : p));
    this.persistCart(); return null;
  }
  removeFromCart(productId: number): void { this.cart.update(lines => lines.filter(p => p.productId !== productId)); this.persistCart(); }
  clearCart(): void { this.cart.set([]); this.persistCart(); }
  async addProduct(data: { name: string; category: string; price: number; stock: number }): Promise<string | null> {
    if (!data.name.trim() || !data.category.trim() || !Number.isFinite(data.price) || data.price < 0.01
      || !Number.isSafeInteger(data.stock) || data.stock < 0) return 'Preencha os campos com nome, categoria, preço e estoque válidos.';
    try {
      const product = await firstValueFrom(this.http.post<Product>('/api/products', data));
      this.products.update(list => [...list, product]);
      return null;
    } catch (error) { return this.apiError(error, 'Não foi possível cadastrar o produto.'); }
  }
  async confirmSale(): Promise<{ sale?: Sale; error?: string }> {
    const lines = this.cart();
    if (!lines.length) return { error: 'Adicione pelo menos um produto antes de confirmar a venda.' };
    if (new Set(lines.map(line => line.productId)).size !== lines.length) return { error: 'O carrinho contém produtos duplicados. Revise a venda.' };
    if (lines.some(line => !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > this.available(line.productId)))
      return { error: 'Estoque insuficiente. Verifique a quantidade selecionada.' };
    try {
      const sale = await firstValueFrom(this.http.post<Sale>('/api/sales', { items: lines }));
      this.movements.update(list => [...sale.items.map(item => ({ productId: item.productId,
        quantity: item.quantity, type: 'saida' as const, date: sale.date, saleId: sale.id })), ...list]);
      this.lastSale.set(sale);
      this.clearCart();
      try {
        this.products.set(await firstValueFrom(this.http.get<Product[]>('/api/products')));
      } catch {
        this.products.update(list => list.map(product => ({ ...product,
          stock: product.stock - (lines.find(line => line.productId === product.id)?.quantity ?? 0) })));
        this.loadError.set('Venda confirmada, mas não foi possível atualizar o estoque na tela. Recarregue a página.');
      }
      return { sale };
    } catch (error) { return { error: this.apiError(error, 'Não foi possível concluir a venda. Tente novamente.') }; }
  }
}
