# FoodBurguer — Backend API

API SaaS multi-tenant para gerenciamento de restaurantes e pedidos online.

## Stack

| Camada | Tecnologia |
|--------|------------|
| Framework | NestJS 11 |
| ORM | Prisma 7 |
| Banco de dados | PostgreSQL |
| Cache | Redis |
| Autenticação | JWT + Refresh Token + OAuth Google |
| Pagamentos | InfinitePay Checkout |
| Documentação | Swagger / OpenAPI |
| Validação | class-validator + class-transformer |
| Segurança | Helmet, Rate Limit, CORS restritivo, RBAC |

---

## Estrutura do projeto

```
src/
├── config/
│   └── app.config.ts              # Configurações tipadas (JWT, Google, Redis, InfinitePay)
│
├── common/
│   ├── decorators/
│   │   ├── current-user.decorator.ts   # @CurrentUser() — extrai usuário do JWT
│   │   ├── roles.decorator.ts          # @Roles(...) — metadado para RBAC
│   │   ├── tenant-id.decorator.ts      # @TenantId() — extrai tenantId do JWT ou header
│   │   └── public.decorator.ts         # @Public() — ignora JwtAuthGuard
│   ├── guards/
│   │   ├── jwt-auth.guard.ts           # Guard JWT padrão (respeita @Public)
│   │   ├── jwt-refresh.guard.ts        # Guard para refresh token
│   │   ├── google-auth.guard.ts        # Guard OAuth Google
│   │   └── roles.guard.ts              # Guard RBAC por UserRole
│   ├── filters/
│   │   └── http-exception.filter.ts    # Filtro global de exceções HTTP
│   └── interceptors/
│       └── logging.interceptor.ts      # Log de cada requisição HTTP
│
├── prisma/
│   ├── prisma.module.ts           # Módulo global do Prisma
│   └── prisma.service.ts          # PrismaService (extends PrismaClient)
│
└── modules/
    ├── auth/                      # JWT, Refresh Token, OAuth Google
    │   ├── strategies/
    │   │   ├── jwt.strategy.ts
    │   │   ├── jwt-refresh.strategy.ts
    │   │   └── google.strategy.ts
    │   ├── dto/
    │   │   ├── login.dto.ts
    │   │   ├── register.dto.ts
    │   │   └── refresh-token.dto.ts
    │   ├── auth.controller.ts
    │   ├── auth.service.ts
    │   └── auth.module.ts
    │
    ├── tenants/                   # CRUD de restaurantes (tenants)
    │   ├── dto/
    │   │   ├── create-tenant.dto.ts
    │   │   └── update-tenant.dto.ts
    │   ├── tenants.controller.ts
    │   ├── tenants.service.ts
    │   └── tenants.module.ts
    │
    ├── users/                     # CRUD de usuários (Customer, Employee, Admin)
    │   ├── dto/
    │   │   ├── create-user.dto.ts
    │   │   └── update-user.dto.ts
    │   ├── users.controller.ts
    │   ├── users.service.ts
    │   └── users.module.ts
    │
    ├── menu/                      # Catálogo (categorias + produtos)
    │   ├── categories/
    │   │   ├── dto/
    │   │   │   ├── create-category.dto.ts
    │   │   │   └── update-category.dto.ts
    │   │   ├── categories.controller.ts
    │   │   ├── categories.service.ts
    │   │   └── categories.module.ts
    │   ├── products/
    │   │   ├── dto/
    │   │   │   ├── create-product.dto.ts
    │   │   │   └── update-product.dto.ts
    │   │   ├── products.controller.ts
    │   │   ├── products.service.ts
    │   │   └── products.module.ts
    │   └── menu.module.ts
    │
    ├── orders/                    # Pedidos LOCAL e DELIVERY + máquina de estados
    │   ├── dto/
    │   │   ├── create-order.dto.ts
    │   │   └── update-order-status.dto.ts
    │   ├── orders.controller.ts
    │   ├── orders.service.ts
    │   └── orders.module.ts
    │
    ├── payments/                  # Integração InfinitePay + webhook HMAC
    │   ├── dto/
    │   │   └── webhook.dto.ts
    │   ├── payments.controller.ts
    │   ├── payments.service.ts
    │   └── payments.module.ts
    │
    ├── delivery/                  # Endereços de entrega do cliente
    │   ├── dto/
    │   │   ├── create-address.dto.ts
    │   │   └── update-address.dto.ts
    │   ├── delivery.controller.ts
    │   ├── delivery.service.ts
    │   └── delivery.module.ts
    │
    └── dashboard/                 # Métricas e relatórios [ADMIN]
        ├── dashboard.controller.ts
        ├── dashboard.service.ts
        └── dashboard.module.ts
```

---

## Rotas da API

| Módulo | Prefixo | Descrição |
|--------|---------|-----------|
| Health | `GET /health` | Health check |
| Auth | `POST /api/v1/auth/register` | Cadastro de cliente |
| Auth | `POST /api/v1/auth/login` | Login email + senha |
| Auth | `POST /api/v1/auth/refresh` | Renovar access token |
| Auth | `POST /api/v1/auth/logout` | Logout |
| Auth | `GET /api/v1/auth/google` | Iniciar OAuth Google |
| Tenants | `GET /api/v1/tenants/slug/:slug` | Dados públicos do restaurante |
| Menu | `GET /api/v1/categories?tenantId=` | Categorias (público) |
| Menu | `GET /api/v1/products?tenantId=` | Produtos (público) |
| Orders | `POST /api/v1/orders` | Criar pedido |
| Orders | `PATCH /api/v1/orders/:id/status` | Atualizar status |
| Payments | `POST /api/v1/payments/checkout/:orderId` | Iniciar checkout |
| Addresses | `CRUD /api/v1/addresses` | Endereços do cliente |
| Dashboard | `GET /api/v1/dashboard/summary` | Métricas [ADMIN] |

Documentação completa (Swagger): `http://localhost:3000/api/docs`

---

## Roles e permissões

| Role | Acesso |
|------|--------|
| `CUSTOMER` | Menu, carrinho, pedidos próprios, endereços |
| `EMPLOYEE` | Visualizar pedidos, atualizar status (PREPARING → READY → DELIVERED) |
| `ADMIN` | CRUD completo do tenant, funcionários, dashboard, relatórios |
| `SUPER_ADMIN` | Gerenciar todos os tenants e assinaturas |

---

## Status dos pedidos

```
PENDING → CONFIRMED → PREPARING → READY → OUT_FOR_DELIVERY → DELIVERED
                                        ↘ DELIVERED (pedido local)
PENDING → CANCELLED (pelo cliente)
```

---

## Como rodar localmente

### Pré-requisitos

- Node.js 22+
- Docker e Docker Compose

### 1. Clonar e instalar dependências

```bash
cd backend
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Editar `.env` com as credenciais do banco e demais serviços:

```env
DATABASE_URL="postgresql://foodburguer:foodburguer@localhost:5432/foodburguer?schema=public"
JWT_SECRET=seu_secret_aqui_min_32_chars
JWT_REFRESH_SECRET=outro_secret_aqui_min_32_chars
```

### 3. Subir banco e Redis com Docker

```bash
# Na raiz do projeto (onde está o docker-compose.yml)
docker-compose up postgres redis -d
```

### 4. Rodar as migrations

```bash
npx prisma migrate dev --name init
```

### 5. Iniciar o servidor

```bash
npm run start:dev
```

O servidor estará disponível em:
- **API:** `http://localhost:3000/api/v1`
- **Swagger:** `http://localhost:3000/api/docs`

---

## Scripts disponíveis

```bash
npm run start:dev      # Desenvolvimento com hot-reload
npm run build          # Compilar para produção
npm run start:prod     # Iniciar build de produção
npm run lint           # Verificar código com ESLint
npm run test           # Testes unitários
npm run test:e2e       # Testes end-to-end
npm run test:cov       # Cobertura de testes
```

## Comandos Prisma

```bash
npx prisma generate          # Regenerar Prisma Client após alterar schema
npx prisma migrate dev       # Criar e aplicar migration em desenvolvimento
npx prisma migrate deploy    # Aplicar migrations em produção
npx prisma studio            # Interface visual do banco de dados
```

---

## Deploy com Docker

```bash
# Na raiz do projeto
docker-compose up --build
```

O `docker-compose.yml` sobe PostgreSQL, Redis e o backend com todas as dependências.

$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
