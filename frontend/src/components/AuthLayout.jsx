import { GraficoCampo } from "./GraficoCampo";

export function AuthLayout({ titulo, subtitulo, children }) {
  return (
    <div className="auth-layout">
      <aside className="auth-painel">
        <div className="auth-painel-conteudo">
          <span className="marca">Pelada</span>
          <h1 className="auth-frase">Bola rolando<br />toda hora.</h1>
          <p className="auth-descricao">
            Organize sua pelada, chame o pessoal e nunca mais fique
            devendo o mensalista.
          </p>
        </div>
        <GraficoCampo />
      </aside>

      <main className="auth-form-area">
        <div className="auth-form-container">
          <h2 className="auth-titulo">{titulo}</h2>
          {subtitulo && <p className="auth-subtitulo">{subtitulo}</p>}
          {children}
        </div>
      </main>
    </div>
  );
}
