import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { CommercialService } from '../../core/commercial.service';
import { IconComponent } from '../../shared/icon.component';

@Component({ selector: 'app-dashboard', standalone: true, imports: [FormsModule, RouterLink, IconComponent], templateUrl: './dashboard.component.html' })
export class DashboardComponent {
  readonly store = inject(CommercialService);
  private readonly route = inject(ActivatedRoute);
  private readonly query = toSignal(this.route.queryParamMap);
  readonly panel = computed(() => this.query()?.get('painel') ?? 'inicio');
  readonly notice = signal('');
  readonly error = signal('');
  product = { name: '', category: 'Mercearia', price: null as number | null, stock: null as number | null };
  addProduct(): void {
    this.error.set(''); this.notice.set('');
    const error = this.store.addProduct({ name: this.product.name, category: this.product.category, price: Number(this.product.price), stock: Number(this.product.stock) });
    if (error) { this.error.set(error); return; }
    this.notice.set('Produto cadastrado com sucesso. Ele já está disponível para venda.');
    this.product = { name: '', category: 'Mercearia', price: null, stock: null };
  }
}
