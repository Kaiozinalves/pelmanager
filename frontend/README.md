# Pelada — Frontend (Sprint 1)

Frontend em React (Vite) cobrindo a primeira sprint do gerenciador de
peladas: login, cadastro, perfil, criar/entrar em pelada, ver detalhes +
participantes de uma pelada, e agendar rodada.

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
├── api/            # chamadas HTTP (axios): usuario, grupo, rodada
├── constants/       # enums.js — opções de posição/perna + helper de erro
├── context/        # AuthContext: guarda o usuário logado
├── pages/          # Login, Cadastro, Home, Perfil, GrupoDetalhes
├── components/     # Input, Button, AuthLayout, ProtectedRoute, GraficoCampo
└── styles/         # tokens.css (design system) + app.css
```

## Mapa de telas ↔ endpoints

| Tela | Endpoint | Status |
|---|---|---|
| Cadastro | `POST /api/usuarios` | ✅ |
| Login | `POST /api/usuarios/login` | ✅ |
| Perfil (ver) | `GET /api/usuarios/{id}` | ✅ |
| Perfil (editar) | `PUT /api/usuarios/{id}` | ✅ |
| Criar pelada | `POST /api/grupos` | ✅ |
| Entrar com código | `POST /api/grupos/entrar` | ✅ |
| Lista "Suas peladas" | `GET /api/grupos/meus?usuarioId=` | ✅ |
| Detalhes + participantes | `GET /api/grupos/{id}` | ✅ |
| Agendar rodada | `POST /api/rodadas` | ✅ (só criar — ainda não existe GET pra listar rodadas) |

Todos os endpoints que o frontend usa já existem no backend atual. O que
ficou de fora da sprint (por decisão de vocês, não é bug):
check-in de presença na rodada (`CheckIn` nunca chegou a virar entidade).

## Detalhes que valem atenção

- **Mensagens de erro do backend** vêm no campo `mensagem` (em português),
  não `message`. O helper `extrairMensagemErro()` em `constants/enums.js`
  já trata isso, tentando `mensagem` e depois `message` como fallback.
- **`GrupoPeladaDetalhesResponseDTO` não inclui endereço** — só o retorno
  de `/grupos/meus` inclui. A tela de detalhes do grupo, por isso, não
  mostra endereço, só nome/código/participantes.
- **Editar perfil não inclui e-mail nem senha** — de propósito. Trocar
  e-mail ou senha geralmente pede um fluxo de confirmação à parte, que
  ainda não existe.
- **Agendar rodada não permite escolher endereço alternativo** no
  formulário — o backend aceita um `enderecoAlternativoId`, mas não existe
  nenhum endpoint pra criar/listar endereços avulsos escolhíveis, então o
  frontend sempre manda `null` (a rodada usa o endereço do próprio grupo).
- **Sem GET de rodadas** — dá pra agendar, mas a tela não lista as rodadas
  já agendadas de um grupo, porque esse endpoint ainda não existe.

## Enums

Os `<select>` de posição e perna dominante usam os mesmos valores dos
enums Java (`GOLEIRO`, `ZAGUEIRO`, `LATERAL`, `MEIO_CAMPO`, `ATACANTE` /
`DESTRO`, `CANHOTO`, `AMBIDESTRO`), batendo com `@Enumerated(EnumType.STRING)`.
