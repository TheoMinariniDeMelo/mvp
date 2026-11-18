import { Injectable } from '@angular/core';
import { CommercialService } from './commercial.service';
import { Product, Sale, StockMovement } from './models';

const STORAGE_KEY = 'gestao-comercial-demo-v1';
const SEED_PRODUCTS: Product[] = [
  { id: 1, name: 'Arroz 5 kg', category: 'Mercearia', price: 25.9, stock: 15, minStock: 5, sku: 'MER-001' },
  { id: 2, name: 'Feijão 1 kg', category: 'Mercearia', price: 8.5, stock: 20, minStock: 5, sku: 'MER-002' },
  { id: 3, name: 'Açúcar 1 kg', category: 'Mercearia', price: 4.9, stock: 12, minStock: 5, sku: 'MER-003' },
  { id: 4, name: 'Café 500 g', category: 'Bebidas', price: 18.9, stock: 8, minStock: 10, sku: 'BEB-004' },
  { id: 5, name: 'Leite 1 L', category: 'Laticínios', price: 5.5, stock: 30, minStock: 5, sku: 'LAT-005' }
];

interface DemoState { products: Product[]; lastSale: Sale | null; movements: StockMovement[]; }

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function isProduct(value: unknown): value is Product {
  return isRecord(value) && Number.isSafeInteger(value['id']) && (value['id'] as number) > 0
    && typeof value['name'] === 'string' && typeof value['category'] === 'string'
    && typeof value['sku'] === 'string' && typeof value['price'] === 'number'
    && Number.isFinite(value['price']) && value['price'] >= 0
    && Number.isSafeInteger(value['stock']) && (value['stock'] as number) >= 0
    && Number.isSafeInteger(value['minStock']) && (value['minStock'] as number) >= 0;
}

function isSale(value: unknown): value is Sale {
  return isRecord(value) && typeof value['id'] === 'string' && typeof value['date'] === 'string'
    && typeof value['total'] === 'number' && Number.isFinite(value['total'])
    && Array.isArray(value['items']) && value['items'].every(item => isRecord(item)
      && Number.isSafeInteger(item['productId']) && typeof item['name'] === 'string'
      && Number.isSafeInteger(item['quantity']) && (item['quantity'] as number) > 0
      && typeof item['unitPrice'] === 'number' && Number.isFinite(item['unitPrice'])
      && typeof item['subtotal'] === 'number' && Number.isFinite(item['subtotal']));
}

function isMovement(value: unknown): value is StockMovement {
  return isRecord(value) && Number.isSafeInteger(value['productId'])
    && Number.isSafeInteger(value['quantity']) && (value['quantity'] as number) > 0
    && (value['type'] === 'saida' || value['type'] === 'entrada')
    && typeof value['date'] === 'string'
    && (value['saleId'] === undefined || typeof value['saleId'] === 'string');
}

function isDemoState(value: unknown): value is DemoState {
  return isRecord(value) && Array.isArray(value['products']) && value['products'].every(isProduct)
    && (value['lastSale'] === null || isSale(value['lastSale']))
    && Array.isArray(value['movements']) && value['movements'].every(isMovement);
}

@Injectable()
export class MockCommercialService extends CommercialService {
  override async load(): Promise<void> {
    this.loading.set(true);
    this.loadError.set('');
    try {
      const state = this.readState();
      this.products.set(state.products);
      this.lastSale.set(state.lastSale);
      this.movements.set(state.movements);
    } finally {
      this.loading.set(false);
    }
  }

  override async addProduct(data: { name: string; category: string; price: number; stock: number }): Promise<string | null> {
    const name = data.name.trim();
    const category = data.category.trim();
    if (!name || !category || !Number.isFinite(data.price) || data.price < 0.01
      || !Number.isSafeInteger(data.stock) || data.stock < 0) {
      return 'Preencha os campos com nome, categoria, preço e estoque válidos.';
    }
    if (this.products().some(product => product.name.toLocaleLowerCase('pt-BR') === name.toLocaleLowerCase('pt-BR'))) {
      return 'Já existe um produto com esse nome.';
    }
    const id = Math.max(0, ...this.products().map(product => product.id)) + 1;
    const product: Product = { id, name, category, price: this.roundMoney(data.price), stock: data.stock,
      minStock: 5, sku: `NOV-${String(id).padStart(3, '0')}` };
    this.products.update(products => [...products, product]);
    this.persistState();
    return null;
  }

  override async confirmSale(): Promise<{ sale?: Sale; error?: string }> {
    const lines = this.cart();
    if (!lines.length) return { error: 'Adicione pelo menos um produto antes de confirmar a venda.' };
    if (new Set(lines.map(line => line.productId)).size !== lines.length) {
      return { error: 'O carrinho contém produtos duplicados. Revise a venda.' };
    }
    if (lines.some(line => !Number.isSafeInteger(line.quantity) || line.quantity < 1
      || !this.products().some(product => product.id === line.productId)
      || line.quantity > this.available(line.productId))) {
      return { error: 'Estoque insuficiente. Verifique a quantidade selecionada.' };
    }

    const date = new Date().toISOString();
    const sale: Sale = { id: `VEN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date, items: this.cartItems().map(item => ({ ...item })), total: this.total() };
    this.products.update(products => products.map(product => ({ ...product,
      stock: product.stock - (lines.find(line => line.productId === product.id)?.quantity ?? 0) })));
    this.movements.update(movements => [...sale.items.map(item => ({ productId: item.productId,
      quantity: item.quantity, type: 'saida' as const, date, saleId: sale.id })), ...movements]);
    this.lastSale.set(sale);
    this.clearCart();
    this.persistState();
    return { sale };
  }

  private roundMoney(value: number): number { return Math.round((value + Number.EPSILON) * 100) / 100; }

  private readState(): DemoState {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: unknown = JSON.parse(saved);
        if (isDemoState(parsed)) return parsed;
      }
    } catch { /* Os dados de exemplo continuam disponíveis sem armazenamento local. */ }
    return { products: SEED_PRODUCTS.map(product => ({ ...product })), lastSale: null, movements: [] };
  }

  private persistState(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ products: this.products(),
        lastSale: this.lastSale(), movements: this.movements() } satisfies DemoState));
    } catch { /* A sessão ainda funciona se o navegador bloquear o armazenamento local. */ }
  }
}
