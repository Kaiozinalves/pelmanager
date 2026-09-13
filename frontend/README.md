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
| Login                         | `POST /api/usuarios/login` | ❌ não existe    |
| Listar minhas peladas         | `GET /api/grupos/meus`   | ❌ não existe      |

## Sobre o login (importante)

Seu backend ainda não tem nenhum mecanismo de autenticação (sem Spring
Security, sem JWT, sem endpoint de login). Por isso, o fluxo atual do
frontend é:

- **Cadastro já loga automaticamente.** O backend devolve o `UsuarioResponseDTO`
  completo (com `id`), então guardo isso no `localStorage` e mando direto
  pra Home — sem precisar de um segundo passo de login.
- **A tela de Login existe na interface**, mas vai dar erro até você criar
  o endpoint. Se quiser algo rápido pra destravar (sem Spring Security de
  verdade ainda), dá pra adicionar isso no `UsuarioService`:

  ```java
  public UsuarioResponseDTO login(String email, String senha) {
      Usuario usuario = usuarioRepository.findByEmail(email)
              .orElseThrow(() -> new RuntimeException("E-mail ou senha inválidos."));

      if (!usuario.getSenha().equals(senha)) {
          throw new RuntimeException("E-mail ou senha inválidos.");
      }

      return new UsuarioResponseDTO(
              usuario.getId(), usuario.getNome(), usuario.getApelido(),
              usuario.getEmail(), usuario.getPernaDominante(),
              usuario.getPosicaoPrimaria(), usuario.getPosicaoSecundaria()
      );
  }
  ```

  Precisa também de `findByEmail` no `UsuarioRepository`:
  ```java
  Optional<Usuario> findByEmail(String email);
  ```

  E o endpoint no `UsuarioController`:
  ```java
  public record LoginRequestDTO(String email, String senha) {}

  @PostMapping("/login")
  public ResponseEntity<UsuarioResponseDTO> login(@RequestBody LoginRequestDTO dto) {
      return ResponseEntity.ok(usuarioService.login(dto.email(), dto.senha()));
  }
  ```

  ⚠️ **Isso NÃO é seguro** — compara a senha em texto puro (seu `Usuario`
  também salva a senha sem hash nenhum hoje). Serve só pra destravar o
  fluxo de demonstração da sprint. Antes de qualquer coisa em produção,
  isso precisa de hash de senha (`BCryptPasswordEncoder`) e, idealmente,
  Spring Security com JWT — mas isso é assunto pra uma sprint futura de
  autenticação, não algo pra resolver agora.

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
