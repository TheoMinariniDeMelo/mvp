# Sistema Web de Gestão Comercial

Monorepo do protótipo de gestão comercial. O Angular exibe o catálogo, o estoque e as vendas; a API Spring Boot valida as operações e persiste produtos, vendas e movimentações em H2. O carrinho em andamento fica no navegador até a confirmação da venda.

## Estrutura

```text
frontend/  Angular 21, interface e testes Vitest
backend/   Spring Boot 4.1, API REST, H2 e testes JUnit
.github/   CI dos dois projetos
```

## Requisitos e execução

- Node.js 24 e npm
- Java 21 ou superior e Maven 3.9+

Em dois terminais, a partir da raiz:

```bash
cd backend
mvn spring-boot:run
```

```bash
cd frontend
npm ci
npm start
```

Abra `http://localhost:4200`. O servidor de desenvolvimento Angular encaminha `/api` para `http://localhost:8080`. Em uma implantação, configure o servidor web para encaminhar esse mesmo prefixo à API.

O banco local é criado em `backend/data/gestao-comercial.mv.db` e recebe cinco produtos de exemplo apenas quando está vazio. Para usar outra instância H2, defina `DATABASE_URL`, `DATABASE_USER` e `DATABASE_PASSWORD` antes de iniciar o backend.

## API

| Método | Caminho | Descrição |
| --- | --- | --- |
| GET | `/api/products` | Lista produtos e saldos |
| POST | `/api/products` | Cadastra produto (`name`, `category`, `price`, `stock`) |
| POST | `/api/sales` | Confirma venda (`items`: `productId`, `quantity`) |
| GET | `/api/sales/latest` | Retorna a última venda |
| GET | `/api/sales/{id}` | Consulta uma venda |
| GET | `/api/stock/movements` | Lista baixas de estoque |

O servidor calcula preços e totais com `BigDecimal`, valida os dados recebidos e bloqueia quantidades acima do saldo. A confirmação da venda e a baixa de estoque ocorrem na mesma transação. Erros de validação retornam HTTP 400; itens não encontrados, 404; conflitos de nome ou estoque, 409. As respostas de erro usam `{ "error": "mensagem" }`.

Exemplo de venda:

```bash
curl -X POST http://localhost:8080/api/sales \
  -H 'Content-Type: application/json' \
  -d '{"items":[{"productId":1,"quantity":2},{"productId":2,"quantity":3}]}'
```

## Validação

```bash
cd frontend && npm test -- --watch=false && npm run build
cd backend && mvn verify
```

O workflow de CI executa as duas validações em jobs separados a cada push e pull request.

## Escopo

O protótipo ainda não implementa autenticação, pagamento ou emissão fiscal. A API deve ser protegida antes de expô-la publicamente. Os dados do carrinho continuam locais a cada navegador; produtos e vendas são compartilhados no banco do backend.
