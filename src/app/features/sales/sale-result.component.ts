import { Component, inject, LOCALE_ID } from '@angular/core';
import { DatePipe, registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
registerLocaleData(localePt);
import { Router, RouterLink } from '@angular/router';
import { CommercialService } from '../../core/commercial.service';
import { IconComponent } from '../../shared/icon.component';

@Component({ selector: 'app-sale-result', standalone: true, imports: [RouterLink, IconComponent, DatePipe], providers: [{ provide: LOCALE_ID, useValue: 'pt-BR' }], templateUrl: './sale-result.component.html' })
export class SaleResultComponent {
  readonly store = inject(CommercialService);
  private readonly router = inject(Router);
  newSale(): void { this.store.clearCart(); void this.router.navigateByUrl('/vendas/nova'); }
}
