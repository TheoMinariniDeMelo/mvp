import { Routes } from '@angular/router';
export const routes: Routes = [
  { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent), title: 'Visão geral | Gestão Comercial' },
  { path: 'vendas/nova', loadComponent: () => import('./features/sales/new-sale.component').then(m => m.NewSaleComponent), title: 'Nova Venda | Gestão Comercial' },
  { path: 'vendas/resultado', loadComponent: () => import('./features/sales/sale-result.component').then(m => m.SaleResultComponent), title: 'Resultado da Venda | Gestão Comercial' },
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  { path: '**', redirectTo: 'dashboard' }
];
