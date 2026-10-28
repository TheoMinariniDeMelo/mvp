import { Injectable, computed, signal } from '@angular/core';
import { CartLine, Product, Sale, SaleItem, StockMovement } from './models';

const INITIAL_PRODUCTS: Product[] = [
  { id: 1, name: 'Arroz 5 kg', category: 'Mercearia', price: 25.90, stock: 15, minStock: 5, sku: 'MER-001' },
  { id: 2, name: 'Feijão 1 kg', category: 'Mercearia', price: 8.50, stock: 20, minStock: 5, sku: 'MER-002' },
  { id: 3, name: 'Açúcar 1 kg', category: 'Mercearia', price: 4.90, stock: 12, minStock: 5, sku: 'MER-003' },
  { id: 4, name: 'Café 500 g', category: 'Bebidas', price: 18.90, stock: 8, minStock: 10, sku: 'BEB-004' },
  { id: 5, name: 'Leite 1 L', category: 'Laticínios', price: 5.50, stock: 30, minStock: 5, sku: 'LAT-005' },
];
const STORAGE_KEY = 'gestao-comercial-mvp-v1';
type SavedState = { products: Product[]; cart: CartLine[]; lastSale: Sale | null; movements: StockMovement[] };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isProduct(value: unknown): value is Product {
  return isRecord(value) && Number.isSafeInteger(value['id']) && typeof value['name'] === 'string'
    && typeof value['category'] === 'string' && typeof value['sku'] === 'string'
    && typeof value['price'] === 'number' && Number.isFinite(value['price'])
    && Number.isSafeInteger(value['stock']) && Number.isSafeInteger(value['minStock']);
}

function isCartLine(value: unknown): value is CartLine {
  return isRecord(value) && Number.isSafeInteger(value['productId'])
    && Number.isSafeInteger(value['quantity']) && (value['quantity'] as number) > 0;
}

function isSaleItem(value: unknown): value is SaleItem {
  return isRecord(value) && Number.isSafeInteger(value['productId']) && typeof value['name'] === 'string'
    && Number.isSafeInteger(value['quantity']) && typeof value['unitPrice'] === 'number'
    && typeof value['subtotal'] === 'number' && Number.isFinite(value['unitPrice']) && Number.isFinite(value['subtotal']);
}

function isSale(value: unknown): value is Sale {
  return isRecord(value) && typeof value['id'] === 'string' && typeof value['date'] === 'string'
    && Array.isArray(value['items']) && value['items'].every(isSaleItem)
    && typeof value['total'] === 'number' && Number.isFinite(value['total']);
}

function isMovement(value: unknown): value is StockMovement {
  return isRecord(value) && Number.isSafeInteger(value['productId']) && Number.isSafeInteger(value['quantity'])
    && (value['type'] === 'saida' || value['type'] === 'entrada') && typeof value['date'] === 'string'
    && (value['saleId'] === undefined || typeof value['saleId'] === 'string');
}

function isSavedState(value: unknown): value is SavedState {
  return isRecord(value) && Array.isArray(value['products']) && value['products'].every(isProduct)
    && Array.isArray(value['cart']) && value['cart'].every(isCartLine)
    && (value['lastSale'] === null || isSale(value['lastSale']))
    && Array.isArray(value['movements']) && value['movements'].every(isMovement);
}

@Injectable({ providedIn: 'root' })
export class CommercialService {
  private readonly saved = this.readSaved();
  readonly products = signal<Product[]>(this.saved?.products ?? INITIAL_PRODUCTS.map(p => ({ ...p })));
  readonly cart = signal<CartLine[]>(this.saved?.cart ?? [{ productId: 1, quantity: 2 }, { productId: 2, quantity: 3 }]);
  readonly lastSale = signal<Sale | null>(this.saved?.lastSale ?? null);
  readonly movements = signal<StockMovement[]>(this.saved?.movements ?? []);
  readonly cartItems = computed<SaleItem[]>(() => this.cart().flatMap(line => {
    const product = this.products().find(p => p.id === line.productId);
    return product ? [{ productId: product.id, name: product.name, quantity: line.quantity, unitPrice: product.price, subtotal: this.round(product.price * line.quantity) }] : [];
  }));
  readonly total = computed(() => this.round(this.cartItems().reduce((sum, item) => sum + item.subtotal, 0)));
  readonly stockCount = computed(() => this.products().reduce((sum, p) => sum + p.stock, 0));
  readonly lowStockCount = computed(() => this.products().filter(p => p.stock <= p.minStock).length);

  private round(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }
  private readSaved(): SavedState | null {
    try {
      const value = localStorage.getItem(STORAGE_KEY);
      if (!value) return null;
      const parsed: unknown = JSON.parse(value);
      return isSavedState(parsed) ? parsed : null;
    } catch { return null; }
  }
  private persist(): void {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ products: this.products(), cart: this.cart(), lastSale: this.lastSale(), movements: this.movements() })); } catch { /* Demo remains functional without storage. */ }
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
    this.persist(); return null;
  }
  updateCart(productId: number, quantity: number): string | null {
    if (!Number.isSafeInteger(quantity) || quantity < 1) return 'A quantidade deve ser maior que zero. Use Remover para excluir o item.';
    if (!this.cart().some(line => line.productId === productId)) return 'Produto não encontrado no carrinho.';
    if (quantity > this.available(productId)) return 'Estoque insuficiente. Verifique a quantidade selecionada.';
    this.cart.update(lines => lines.map(p => p.productId === productId ? { ...p, quantity } : p));
    this.persist(); return null;
  }
  removeFromCart(productId: number): void { this.cart.update(lines => lines.filter(p => p.productId !== productId)); this.persist(); }
  clearCart(): void { this.cart.set([]); this.persist(); }
  addProduct(data: { name: string; category: string; price: number; stock: number }): string | null {
    if (!data.name.trim() || !data.category.trim() || !Number.isFinite(data.price) || data.price < 0.01 || !Number.isSafeInteger(data.stock) || data.stock < 0) return 'Preencha os campos com nome, categoria, preço e estoque válidos.';
    if (this.products().some(p => p.name.toLocaleLowerCase('pt-BR') === data.name.trim().toLocaleLowerCase('pt-BR'))) return 'Já existe um produto com esse nome.';
    const id = Math.max(0, ...this.products().map(p => p.id)) + 1;
    this.products.update(list => [...list, { id, name: data.name.trim(), category: data.category.trim(), price: this.round(data.price), stock: data.stock, minStock: 5, sku: `NOV-${String(id).padStart(3, '0')}` }]);
    this.persist(); return null;
  }
  confirmSale(): { sale?: Sale; error?: string } {
    const lines = this.cart();
    if (!lines.length) return { error: 'Adicione pelo menos um produto antes de confirmar a venda.' };
    if (new Set(lines.map(line => line.productId)).size !== lines.length) return { error: 'O carrinho contém produtos duplicados. Revise a venda.' };
    if (lines.some(line => !Number.isSafeInteger(line.quantity) || line.quantity < 1 || line.quantity > this.available(line.productId))) return { error: 'Estoque insuficiente. Verifique a quantidade selecionada.' };
    try {
      const now = new Date();
      const sale: Sale = { id: `VEN-${String(now.getTime()).slice(-8)}`, date: now.toISOString(), items: this.cartItems(), total: this.total() };
      this.products.update(list => list.map(p => ({ ...p, stock: p.stock - (lines.find(line => line.productId === p.id)?.quantity ?? 0) })));
      this.movements.update(list => [...list, ...lines.map(line => ({ productId: line.productId, quantity: line.quantity, type: 'saida' as const, date: sale.date, saleId: sale.id }))]);
      this.lastSale.set(sale); this.cart.set([]); this.persist();
      return { sale };
    } catch { return { error: 'Não foi possível concluir a venda. Tente novamente.' }; }
  }
}
