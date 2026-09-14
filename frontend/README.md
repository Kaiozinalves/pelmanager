# Pelada — Frontend (Sprint 1)

Frontend em React (Vite) cobrindo a primeira sprint do gerenciador de
peladas: cadastro de usuário, criar pelada e entrar numa pelada com código
de convite. Construído a partir do projeto `pelmanager` (Spring Boot) real.

## Como rodar

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. Configure a URL da API no `.env`:

```
VITE_API_URL=http://localhost:8080/api
```

## Estrutura

```
src/
├── api/            # chamadas HTTP (axios)
├── context/        # AuthContext: guarda o usuário "logado"
├── pages/          # Login, Cadastro, Home
├── components/     # Input, Button, AuthLayout, ProtectedRoute, GraficoCampo
└── styles/         # tokens.css (design system) + app.css
```

## Como cada tela bate com o backend `com.pelmanager`

| Tela / ação                  | Endpoint                | Status no backend |
|-------------------------------|--------------------------|--------------------|
| Cadastro                      | `POST /api/usuarios`     | ✅ existe          |
| Criar pelada                  | `POST /api/grupos`       | ✅ existe          |
| Entrar com código de convite  | `POST /api/grupos/entrar`| ✅ existe          |
| Login                         | `POST /api/usuarios/login` | ✅ existe        |
| Listar minhas peladas         | `GET /api/grupos/meus`   | ❌ não existe      |

## Sobre o login

O backend já tem o endpoint de autenticação implementado em
`POST /api/usuarios/login`.

O frontend usa esse fluxo assim:

- faz a requisição com `email` e `senha`;
- salva o `UsuarioResponseDTO` em `localStorage`;
- redireciona para a Home;
- envia o `pelada_token` em todas as chamadas, quando existir.

Ainda vale lembrar que a autenticação atual é uma implementação de sprint,
sem hash de senha e sem JWT real. Isso é suficiente para rodar a demo, mas
precisa ser substituído por uma estratégia segura em produção.

## Criar pelada

`GrupoPeladaRequestDTO` não tem endereço (diferente do que a gente tinha
desenhado antes) — só `nome` e `fundadorId`. O `fundadorId` é preenchido
automaticamente com o `id` do usuário logado, o campo não aparece no
formulário.

O `codigoConvite` é gerado pelo backend na criação — a tela mostra ele
destacado assim que a pelada é criada, pra você copiar e mandar pro grupo.

## Entrar numa pelada

Novo formulário na Home. Chama `POST /api/grupos/entrar` com
`{ IdUsuario, codigoConvite }` (repara que o DTO usa `IdUsuario` com "I"
maiúsculo — reflete exatamente o nome do campo no
`EntrarGrupoPeladaRequestDTO`).

## Lista "Suas peladas"

Como `GET /api/grupos/meus` ainda não existe, a lista mostra só o que foi
criado ou entrado durante a sessão atual do navegador (fica vazia de novo
se você recarregar a página). Assim que você implementar esse endpoint no
backend, a tela detecta a resposta e passa a confiar nela — não precisa
mexer no código do frontend, só implementar o endpoint.

## Enums

Os `<select>` de posição e perna dominante usam os mesmos valores dos
enums Java (`GOLEIRO`, `ZAGUEIRO`, `LATERAL`, `MEIO_CAMPO`, `ATACANTE` /
`DESTRO`, `CANHOTO`, `AMBIDESTRO`), batendo com `@Enumerated(EnumType.STRING)`.
