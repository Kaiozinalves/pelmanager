import { useEffect, useRef, useState } from "react";

// Copia um texto (ex.: código de convite) e mostra "Copiado!" por 2 segundos.
// Se o navegador bloquear a área de transferência (ex.: site em http fora do
// localhost), cai num método antigo que funciona em qualquer contexto.
export function BotaoCopiar({ texto, rotulo = "Copiar código" }) {
  const [copiado, setCopiado] = useState(false);
  const temporizador = useRef(null);

  useEffect(() => () => clearTimeout(temporizador.current), []);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(texto);
    } catch {
      const campo = document.createElement("textarea");
      campo.value = texto;
      document.body.appendChild(campo);
      campo.select();
      document.execCommand("copy");
      campo.remove();
    }
    setCopiado(true);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <button type="button" className="botao botao--secundario botao--pequeno" onClick={copiar}>
      {copiado ? "Copiado!" : rotulo}
    </button>
  );
}
