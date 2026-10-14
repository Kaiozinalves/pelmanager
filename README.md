# PelManager

Aplicação web para organizar peladas de futebol. O projeto reúne uma API REST em Java/Spring Boot e uma interface web em React. A API usa PostgreSQL para persistir usuários, grupos, endereços e rodadas.

## Funcionalidades

- Cadastro, login e edição de perfil de jogadores.
- Criação de grupos de pelada, convite por código e consulta dos grupos dos quais o jogador participa.
- Agendamento e finalização de rodadas.
- Check-in de presença.
- Sorteio aleatório ou balanceado de times. O sorteio balanceado considera posição e avaliações.
- Avaliação de jogadores após a rodada.
- Interface em português, adaptada para desktop e dispositivos móveis.

## Tecnologias

- **Backend:** Java 17, Spring Boot 4, Spring MVC, Spring Data JPA, Hibernate, Maven e PostgreSQL.
- **Frontend:** React 19, React Router, Axios, Vite e npm.
- **Documentação da API:** OpenAPI/Swagger UI via Springdoc.

## Requisitos

- JDK 17 ou superior.
- Node.js `^20.19.0` ou `>=22.12.0` e npm (versões exigidas pelo Vite deste projeto).
- PostgreSQL instalado e em execução.

## Como executar localmente

Abra dois terminais na raiz do repositório: um para a API e outro para a interface.

### 1. Preparar o banco de dados

Crie um banco PostgreSQL chamado `pelmanager_db`, por exemplo, usando `psql`:

```sql
CREATE DATABASE pelmanager_db;
```

O Spring Boot cria/atualiza as tabelas automaticamente (`spring.jpa.hibernate.ddl-auto=update`). Configure a conexão da API com variáveis de ambiente antes de iniciar. No PowerShell:

```powershell
$env:SPRING_DATASOURCE_URL = "jdbc:postgresql://localhost:5432/pelmanager_db"
$env:SPRING_DATASOURCE_USERNAME = "postgres"
$env:SPRING_DATASOURCE_PASSWORD = "sua_senha_local"
```

No macOS/Linux, use os equivalentes `export SPRING_DATASOURCE_URL=...`, `export SPRING_DATASOURCE_USERNAME=...` e `export SPRING_DATASOURCE_PASSWORD=...`. Ajuste URL, usuário e senha para a instalação local. Essas variáveis substituem os valores padrão de `src/main/resources/application.properties`; não compartilhe credenciais reais.

### 2. Iniciar o backend

Na raiz do projeto:

```powershell
./mvnw.cmd spring-boot:run
```

No macOS/Linux:

```bash
./mvnw spring-boot:run
```

O Maven Wrapper baixa a versão configurada do Maven na primeira execução. A API ficará disponível em `http://localhost:8080/api`. A interface Swagger fica em `http://localhost:8080/swagger-ui/index.html`.

### 3. Iniciar o frontend

Em outro terminal:

```powershell
cd frontend
npm install
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm run dev
```

Se ainda não existir, crie `frontend/.env` copiando `.env.example` (PowerShell: `Copy-Item .env.example .env`; macOS/Linux: `cp .env.example .env`). Confira se ele aponta para a API local:

```dotenv
VITE_API_URL=http://localhost:8080/api
```

Abra `http://localhost:5173` no navegador. Mantenha os dois processos em execução enquanto usa a aplicação.

## Comandos úteis

Execute a partir de `frontend/`:

```bash
npm run dev      # servidor de desenvolvimento
npm run build    # gera o build de produção em frontend/dist
npm run preview  # pré-visualiza o build localmente
npm run lint     # análise estática com oxlint
```

Execute a partir da raiz para compilar ou rodar os testes do backend:

```bash
./mvnw clean package
./mvnw test
```

No Windows, use `./mvnw.cmd` no lugar de `./mvnw`.

## Organização do repositório

```text
src/main/java/com/pelmanager/   # API: controllers, serviços, entidades, DTOs e repositórios
src/main/resources/             # configuração do Spring Boot
src/test/                       # testes do backend
frontend/src/api/                # chamadas HTTP para a API
frontend/src/components/         # componentes reutilizáveis
frontend/src/context/             # estado de sessão do usuário
frontend/src/pages/               # telas da aplicação
frontend/src/styles/              # estilos e tokens visuais
```

## Principais rotas da API

Todas as rotas usam o prefixo `/api`.

| Recurso | Rotas |
|---|---|
| Usuários | `POST /usuarios`, `POST /usuarios/login`, `GET /usuarios/{id}`, `PUT /usuarios/{id}` |
| Grupos | `POST /grupos`, `POST /grupos/entrar`, `GET /grupos/meus?usuarioId={id}`, `GET /grupos/{id}` |
| Rodadas | `POST /rodadas`, `PATCH /rodadas/{id}/finalizar` |
| Check-ins | `POST /checkins`, `GET /checkins/rodada/{rodadaId}` |
| Sorteios | `POST /sorteios`, `POST /sorteios/aleatorio`, `GET /sorteios/rodada/{rodadaId}` |
| Avaliações | `POST /avaliacoes`, `GET /avaliacoes/rodada/{rodadaId}` |

A documentação interativa em `/swagger-ui/index.html` lista os contratos expostos pela API.

## Observações

- O login atual verifica as credenciais pela API, mas ainda não usa Spring Security, JWT ou tokens de sessão. A proteção de rotas no frontend é uma barreira de navegação do cliente, não um mecanismo de autorização do backend.
- O frontend permite agendar rodada no endereço do grupo; não há fluxo de interface para selecionar um endereço alternativo.
- Para usar em produção, configure credenciais e banco adequados, autenticação e autorização no backend e ajuste CORS para os domínios reais da aplicação.
