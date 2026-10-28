# Sistema Web de Gestão Comercial — protótipo do MVP

Protótipo acadêmico em Angular 21 para um pequeno comércio. A interface demonstra o cadastro de produtos, consulta de estoque, registro de vendas e baixa automática do estoque. Os dados são fictícios e ficam apenas no navegador.

## Instalação e execução

Use uma versão de Node.js compatível com Angular 21.

```bash
npm install
npm start
```

Abra `http://localhost:4200`. Para validar o projeto:

```bash
npm run build
npm test -- --watch=false
```

## Rotas

| Rota | Interface |
| --- | --- |
| `/dashboard` | Menu inicial e visão geral |
| `/vendas/nova` | Registro de venda |
| `/vendas/resultado` | Resultado da última venda confirmada |

Os painéis de Produtos e Consultar Estoque ficam dentro de `/dashboard`, acessíveis pelo menu. O cadastro de produtos é local e os itens adicionados ficam disponíveis para venda.

## Estrutura principal

```text
src/app/
├── core/
│   ├── models.ts                    # Product, Sale, SaleItem e StockMovement
│   ├── commercial.service.ts        # Estoque, carrinho, confirmação e persistência local
│   └── commercial.service.spec.ts   # Cálculo e validação de estoque
├── shared/
│   └── icon.component.ts            # Ícones SVG reutilizáveis
├── features/
│   ├── dashboard/                   # Menu inicial, produtos e estoque
│   └── sales/                       # Nova venda e resultado
├── app.ts                           # Estrutura de navegação e cabeçalho
└── app.routes.ts                    # As três rotas principais
```

O carrinho inicial contém 2 unidades de Arroz 5 kg e 3 de Feijão 1 kg, totalizando **R$ 77,30**. Ao confirmar, o protótipo grava a venda simulada, deduz as quantidades e mostra o comprovante. A opção **Nova Venda** inicia um carrinho vazio.

## Capturas acadêmicas

Este ambiente de execução restringe servidores locais e impede a inicialização dos navegadores headless, por isso as imagens não foram geradas aqui. Para capturá-las em um computador com navegador:

1. Execute `npm start` e abra o Chrome ou outro navegador em `http://localhost:4200`.
2. No DevTools, configure a área de visualização para **1440 × 900**, zoom em **100%** e capture apenas a página, sem a interface do navegador.
3. Se já utilizou o protótipo, limpe o armazenamento local da origem `localhost:4200` e recarregue a página para restaurar os dados iniciais.
4. Capture `/dashboard` como `evidencias/tela-01-dashboard.png`.
5. Acesse `/vendas/nova`, confira **R$ 77,30** e capture `evidencias/tela-02-registro-venda.png`.
6. Clique em **Confirmar Venda** e capture `/vendas/resultado` como `evidencias/tela-03-resultado-venda.png`.

## Limitações

Não há servidor, banco de dados ou autenticação. O botão **Sair** exibe um aviso demonstrativo. As informações ficam no `localStorage` do navegador e podem ser apagadas nas ferramentas do navegador. O resultado guarda somente a última venda; histórico de vendas, pagamentos e emissão fiscal não fazem parte deste MVP.
