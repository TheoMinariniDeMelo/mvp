export interface Product { id: number; name: string; category: string; price: number; stock: number; minStock: number; sku: string; }
export interface SaleItem { productId: number; name: string; quantity: number; unitPrice: number; subtotal: number; }
export interface Sale { id: string; date: string; items: SaleItem[]; total: number; }
export interface StockMovement { productId: number; quantity: number; type: 'saida' | 'entrada'; date: string; saleId?: string; }
export type CartLine = { productId: number; quantity: number };
