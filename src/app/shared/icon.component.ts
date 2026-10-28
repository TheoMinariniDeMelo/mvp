import { Component, Input } from '@angular/core';
@Component({ selector: 'app-icon', standalone: true, template: `<svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path [attr.d]="paths[name] || paths['circle-help']" /></svg>`, styles: [':host{display:inline-flex;align-items:center;justify-content:center;flex:none} svg{display:block}'] })
export class IconComponent {
  @Input({ required: true }) name = '';
  readonly paths: Record<string, string> = {
    'layout-dashboard': 'M3 3h8v8H3z M13 3h8v5h-8z M13 10h8v11h-8z M3 13h8v8H3z',
    'shopping-cart': 'M2 3h2l2.4 11.4a2 2 0 0 0 2 1.6H19a2 2 0 0 0 2-1.6L22 7H5 M9 21h.01 M19 21h.01',
    'package': 'M12 2 3 7v10l9 5 9-5V7z M3 7l9 5 9-5 M12 12v10 M7.5 4.5l9 5',
    'boxes': 'M2 7h9v7H2z M13 7h9v7h-9z M7 15h10v7H7z M6.5 7V3h11v4',
    'circle-help': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.5 9a2.5 2.5 0 0 1 5 0c0 2-2.5 2-2.5 4 M12 17h.01',
    'log-out': 'M10 17l5-5-5-5 M15 12H3 M12 3h6a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3h-6',
    'info': 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 11v6 M12 7h.01',
    'x': 'M18 6 6 18 M6 6l12 12', 'arrow-right': 'M5 12h14 M13 6l6 6-6 6',
    'arrow-left': 'M19 12H5 M11 18l-6-6 6-6',
    'search': 'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M17 17l5 5',
    'plus': 'M12 5v14 M5 12h14', 'minus': 'M5 12h14', 'trash': 'M3 6h18 M8 6V4h8v2 M6 6l1 15h10l1-15 M10 10v7 M14 10v7',
    'check': 'M20 6 9 17l-5-5', 'check-circle': 'M22 11.1V12a10 10 0 1 1-5.9-9.1 M22 4 12 14l-3-3',
    'alert-triangle': 'M10.3 3.9 1.9 18.1A2 2 0 0 0 3.6 21h16.8a2 2 0 0 0 1.7-2.9L13.7 3.9a2 2 0 0 0-3.4 0z M12 9v4 M12 17h.01',
    'calendar': 'M3 5h18v16H3z M7 3v4 M17 3v4 M3 10h18',
    'receipt': 'M4 2v20l4-2 4 2 4-2 4 2V2z M8 7h8 M8 11h8 M8 15h5',
    'trending-up': 'M3 17l6-6 4 4 8-8 M15 7h6v6',
    'clipboard-list': 'M8 3H5a2 2 0 0 0-2 2v16h18V5a2 2 0 0 0-2-2h-3 M9 2h6v4H9z M8 11h8 M8 16h8',
    'chevron-right': 'm9 18 6-6-6-6'
  };
}
