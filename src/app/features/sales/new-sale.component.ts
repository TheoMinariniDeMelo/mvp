import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommercialService } from '../../core/commercial.service';
import { IconComponent } from '../../shared/icon.component';

@Component({ selector: 'app-new-sale', standalone: true, imports: [RouterLink, IconComponent], templateUrl: './new-sale.component.html' })
export class NewSaleComponent {
  readonly store = inject(CommercialService);
  private readonly router = inject(Router);
  readonly search = signal('');
  readonly quantities = signal<Record<number, number>>({});
  readonly error = signal('');
  readonly errorProductId = signal<number | null>(null);
  readonly notice = signal('');
  readonly confirming = signal(false);
  readonly filtered = computed(() => {
    const term = this.search().trim().toLocaleLowerCase('pt-BR');
    return this.store.products().filter(p => [p.name, p.sku, p.category].some(value => value.toLocaleLowerCase('pt-BR').includes(term)));
  });
  quantity(id: number): number { return this.quantities()[id] ?? 1; }
  setQuantity(id: number, raw: string): void {
    const value = Number(raw);
    if (!Number.isInteger(value) || value < 1) { this.quantities.update(all => ({ ...all, [id]: 0 })); this.errorProductId.set(id); this.error.set('Informe uma quantidade inteira maior que zero.'); return; }
    this.quantities.update(all => ({ ...all, [id]: value })); this.errorProductId.set(value > this.store.available(id) ? id : null); this.error.set(value > this.store.available(id) ? 'Estoque insuficiente. Verifique a quantidade selecionada.' : '');
  }
  stepQuantity(id: number, delta: number): void {
    const next = this.quantity(id) + delta;
    if (next >= 1 && next <= this.store.available(id)) { this.quantities.update(all => ({ ...all, [id]: next })); this.errorProductId.set(null); this.error.set(''); }
  }
  add(id: number): void {
    this.error.set(''); this.notice.set('');
    const error = this.store.addToCart(id, this.quantity(id));
    if (error) { this.error.set(error); this.errorProductId.set(id); }
    else { this.errorProductId.set(null); this.notice.set('Produto adicionado ao resumo da venda.'); this.quantities.update(all => ({ ...all, [id]: 1 })); }
  }
  updateCart(id: number, delta: number): void {
    this.error.set(''); this.notice.set('');
    const current = this.store.inCart(id);
    if (current + delta < 1) { this.store.removeFromCart(id); return; }
    const error = this.store.updateCart(id, current + delta);
    if (error) this.error.set(error);
  }
  remove(id: number): void { this.store.removeFromCart(id); this.error.set(''); this.notice.set('Produto removido do resumo.'); }
  confirm(): void {
    if (this.confirming()) return;
    this.error.set(''); this.notice.set(''); this.confirming.set(true);
    setTimeout(() => {
      const result = this.store.confirmSale(); this.confirming.set(false);
      if (result.error) this.error.set(result.error);
      else void this.router.navigateByUrl('/vendas/resultado');
    }, 350);
  }
  cancel(): void { this.store.clearCart(); void this.router.navigateByUrl('/dashboard'); }
}
