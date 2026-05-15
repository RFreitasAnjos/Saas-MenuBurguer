# FOODBURGUER — Contexto Arquitetural para GitHub Copilot

## Visão Geral do Projeto

**FoodBurguer** é uma plataforma SaaS multi-tenant para gerenciamento de restaurantes e pedidos online.

O sistema permitirá que múltiplos restaurantes utilizem a mesma infraestrutura pagando uma assinatura mensal de baixo custo. O foco principal é:

* Baixo custo operacional;
* Arquitetura escalável;
* Segurança robusta;
* Alta produtividade no desenvolvimento;
* UX moderna mobile-first;
* Painel administrativo desktop-oriented;
* Backend centralizado com NestJS;
* Frontend desacoplado com SvelteKit.

---

# Stack Principal

## Backend

* Framework: NestJS
* ORM: Prisma ORM
* Banco de Dados: PostgreSQL
* Autenticação:

  * JWT Access Token
  * Refresh Token
  * OAuth Google
* Cache:

  * Redis
* Upload:

  * S3 Compatible Storage
* Gateway de pagamento:

  * InfinitePay Checkout
* Documentação:

  * Swagger/OpenAPI
* Validação:

  * class-validator
  * class-transformer
* Segurança:

  * Helmet
  * Rate Limit
  * CSRF Strategy
  * CORS restritivo
  * RBAC
  * Tenant Isolation

---

## Frontend Cliente

* Framework: SvelteKit
* UI:

  * TailwindCSS
  * Skeleton UI ou shadcn-svelte
* Estado:

  * Stores do Svelte
* PWA:

  * Sim
* Mobile First:

  * Obrigatório

---

## Painel Administrativo

### Requisitos

O painel administrativo NÃO será servido pelo SvelteKit inicialmente.

O admin acessará diretamente a API NestJS através de:

* `/admin`
* `/dashboard`
* `/manage`

Objetivo:

* reduzir custo;
* evitar múltiplos deploys;
* simplificar infraestrutura;
* facilitar hospedagem barata.

Pode ser utilizado:

* SSR com Handlebars/EJS;
* ou um painel simples servido pelo NestJS.

O frontend SvelteKit será exclusivo dos clientes.

---

# Arquitetura SaaS Multi-Tenant

Cada restaurante será um TENANT.

## Estratégia de Multi-Tenant

### Modelo escolhido:

**Shared Database + Tenant Isolation**

Tabela contendo:

* `tenant_id`

Todas as entidades obrigatoriamente terão:

* `tenant_id`
* filtros automáticos por tenant.

---

# Perfis do Sistema

## CUSTOMER

Cliente do restaurante.

Permissões:

* Cadastro/login;
* OAuth Google;
* Visualizar cardápio;
* Adicionar carrinho;
* Criar pedidos;
* Delivery;
* Pedido local (mesa);
* Histórico;
* Pagamento online;
* Salvar endereços.

---

## EMPLOYEE

Funcionário da loja.

Permissões:

* Visualizar pedidos;
* Atualizar status;
* Ver:

  * nome do cliente;
  * telefone;
  * mesa;
  * endereço;
* Alterar:

  * EM_PREPARO
  * PRONTO
  * SAIU_PARA_ENTREGA
  * ENTREGUE

SEM acesso:

* financeiro;
* configurações;
* produtos;
* funcionários;
* faturamento.

---

## ADMIN

Administrador da loja.

Permissões:

* CRUD completo da loja;
* Cadastro de funcionários;
* Configuração do restaurante;
* Categorias;
* Produtos;
* Funcionamento;
* Áreas de entrega;
* Relatórios;
* Faturamento;
* Cupons;
* Gestão de pedidos;
* Configuração de pagamento.

---

## SUPER ADMIN (futuro)

Administrador da plataforma SaaS.

Permissões:

* Gerenciar tenants;
* Assinaturas;
* Bloquear restaurantes;
* Métricas globais;
* Billing SaaS.

---

# Fluxo de Autenticação

## Cliente

### Login

* Email + senha
* Google OAuth

### Regras

* Email único globalmente;
* Senha:

  * bcrypt/argon2;
  * mínimo 8 caracteres;
  * hash forte.

---

## Admin

### Fluxo diferente

Admin NÃO utiliza frontend SvelteKit.

Acesso:

* `/admin/login`

Admin criado apenas por:

* proprietário do restaurante;
* super admin.

---

# Módulos do Backend

# AUTH MODULE

Responsável por:

* JWT
* Refresh Token
* OAuth Google
* Guards
* RBAC
* Session Control

---

# USER MODULE

Entidades:

* Customer
* Employee
* Admin

---

# TENANT MODULE

Responsável por:

* Restaurante
* Assinatura
* Configuração
* Branding
* Horários

---

# MENU MODULE

Responsável por:

* Produtos
* Categorias
* Extras
* Combos
* Disponibilidade

---

# ORDER MODULE

Responsável por:

* Carrinho
* Pedido
* Status
* Mesa
* Delivery
* Pagamento

---

# PAYMENT MODULE

Integração:

* InfinitePay Checkout

Fluxos:

* PIX
* Cartão
* Checkout link

Webhook obrigatório.

---

# DELIVERY MODULE

Responsável por:

* Endereços;
* Taxa de entrega;
* Áreas atendidas.

Pode utilizar:

* GeoJSON;
* CEP;
* Radius.

---

# DASHBOARD MODULE

Métricas:

* faturamento;
* pedidos;
* ticket médio;
* produtos mais vendidos.

---

# NOTIFICATION MODULE

Futuro:

* WhatsApp;
* Email;
* Push;
* SMS.

---

# Estrutura de Banco de Dados

## Principais entidades

### tenants

```ts
id
name
slug
phone
logo
primaryColor
isActive
createdAt
```

### users

```ts
id
tenantId
name
email
password
role
googleId
phone
createdAt
```

### addresses

```ts
id
userId
street
number
district
city
state
zipCode
reference
```

### categories

```ts
id
tenantId
name
slug
icon
active
```

### products

```ts
id
tenantId
categoryId
name
description
price
image
active
```

### orders

```ts
id
tenantId
userId
type
status
paymentStatus
tableNumber
total
createdAt
```

### order_items

```ts
id
orderId
productId
quantity
price
```

### payments

```ts
id
orderId
gateway
gatewayReference
status
paidAt
```

---

# Tipos de Pedido

## LOCAL

Cliente:

* informa mesa;
* faz pedido;
* paga pelo app ou localmente.

---

## DELIVERY

Cliente:

* seleciona endereço;
* taxa de entrega automática;
* pagamento online ou na entrega.

---

# Status do Pedido

```txt
PENDING
CONFIRMED
PREPARING
READY
OUT_FOR_DELIVERY
DELIVERED
CANCELLED
```

---

# Segurança Obrigatória

## Regras

### Nunca confiar no frontend

Toda validação deve ocorrer no backend.

---

## Implementar

* RBAC;
* Rate limiting;
* DTO validation;
* JWT expiration;
* Refresh rotation;
* CSRF;
* SQL Injection prevention;
* XSS prevention;
* Tenant isolation;
* Soft delete;
* Audit logs.

---

# Estratégia de Custos

## Objetivo

Hospedagem extremamente barata.

---

## Backend

Pode iniciar com:

* VPS barata;
* Docker;
* Coolify;
* Railway;
* Render;
* Hetzner.

---

## Banco

Inicialmente:

* PostgreSQL compartilhado.

---

## Arquitetura inicial

### Monolito Modular

NÃO utilizar microserviços inicialmente.

Motivos:

* menor custo;
* menor complexidade;
* deploy simples;
* manutenção barata.

---

# Estrutura Recomendada do Backend

```txt
src/
 ├── modules/
 │    ├── auth/
 │    ├── users/
 │    ├── tenants/
 │    ├── menu/
 │    ├── orders/
 │    ├── payments/
 │    ├── dashboard/
 │    └── delivery/
 │
 ├── common/
 │    ├── guards/
 │    ├── decorators/
 │    ├── interceptors/
 │    ├── filters/
 │    ├── pipes/
 │    └── utils/
 │
 ├── prisma/
 ├── config/
 └── main.ts
```

---

# Estratégia Frontend SvelteKit

## Objetivo

Frontend:

* extremamente rápido;
* SEO friendly;
* mobile first;
* UX moderna;
* PWA.

---

# Áreas do Frontend

## Cliente

### Rotas

```txt
/
 /menu
 /cart
 /checkout
 /orders
 /profile
```

---

# Funcionalidades Frontend

## Cliente

* catálogo;
* busca;
* carrinho persistente;
* login social;
* checkout;
* status em tempo real;
* histórico;
* tema moderno.

---

# Design System

## Estilo visual

Inspirar-se em:

* iFood;
* Rappi;
* Uber Eats;
* McDonald's App.

---

## Características

* Dark mode;
* animações suaves;
* cards modernos;
* bottom navigation;
* skeleton loading;
* foco em thumb dos produtos.

---

# Regras Importantes

## Cliente sem login

Pode:

* visualizar menu;
* adicionar carrinho.

Não pode:

* finalizar pedido.

---

# Estratégia de Deploy

## Backend

Docker obrigatório.

---

## Variáveis

```env
DATABASE_URL=
JWT_SECRET=
JWT_REFRESH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
INFINITEPAY_API_KEY=
REDIS_URL=
```

---

# Estratégia de Escalabilidade

## Futuro

Separar:

* pagamentos;
* notificações;
* analytics.

Somente quando houver necessidade real.

---

# Boas práticas obrigatórias

## Código

* SOLID;
* Clean Architecture;
* Modularização;
* DTOs;
* Repository Pattern;
* Services desacoplados;
* Guards;
* Interceptors;
* Exceptions centralizadas.

---

# Convenções

## API REST

```txt
/api/v1/
```

---

## Admin API

```txt
/admin/api/v1/
```

---

# Logs

Implementar:

* request logs;
* audit logs;
* error logs;
* payment logs.

---

# Roadmap Futuro

## Fase 2

* WhatsApp bot;
* IA para sugestão de produtos;
* fidelidade;
* cupom;
* cashback;
* multi-filial.

---

# Decisão Arquitetural Principal

## Escolha Oficial

### Backend:

NestJS Monolítico Modular

### Frontend:

SvelteKit separado

### Banco:

PostgreSQL

### Auth:

JWT + OAuth Google

### SaaS:

Multi-tenant com tenant_id

### Deploy:

Docker

### Painel:

Servido diretamente pelo NestJS

### Objetivo:

Sistema SaaS barato, escalável e moderno para pequenas lojas.
