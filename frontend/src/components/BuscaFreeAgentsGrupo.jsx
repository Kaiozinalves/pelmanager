import { useState } from "react";
import { Select } from "./Input";
import { Button } from "./Button";
import { BotaoCopiar } from "./BotaoCopiar";
import { buscarFreeAgents } from "../api/freeAgent";
import { PERNAS, POSICOES, extrairMensagemErro } from "../constants/enums";

const POSICAO_ROTULO = Object.fromEntries(POSICOES.map((item) => [item.valor, item.rotulo]));
const PERNA_ROTULO = Object.fromEntries(PERNAS.map((item) => [item.valor, item.rotulo]));

function descreverLocal({ bairro, cidade, estado }) {
  const cidadeUf = estado ? `${cidade}/${estado}` : cidade;
  return bairro ? `${bairro}, ${cidadeUf}` : cidadeUf;
}

export function BuscaFreeAgentsGrupo({ grupo }) {
  const [posicao, setPosicao] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultados, setResultados] = useState(null);

  async function aoBuscar(evento) {
    evento.preventDefault();
    setErro(null);
    setBuscando(true);
    try {
      const agentes = await buscarFreeAgents({
        grupoId: Number(grupo.id),
        posicao: posicao || undefined,
      });
      setResultados(agentes);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível buscar free agents agora."));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <section className="painel painel--form">
      <h2 className="painel-titulo">Encontrar jogadores para esta pelada</h2>
      <p className="texto-suave">
        A busca usa a cidade do endereço desta pelada e não inclui quem já participa do grupo.
      </p>

      <form className="formulario" onSubmit={aoBuscar} noValidate>
        <Select
          id={`free-agent-posicao-${grupo.id}`}
          label="Posição"
          value={posicao}
          onChange={(evento) => setPosicao(evento.target.value)}
        >
          <option value="">Qualquer posição</option>
          {POSICOES.map((item) => (
            <option key={item.valor} value={item.valor}>
              {item.rotulo}
            </option>
          ))}
        </Select>

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}
        <Button type="submit" carregando={buscando}>
          Buscar free agents
        </Button>
      </form>

      {resultados && (
        <div className="resultados-free-agents" aria-live="polite">
          {resultados.length === 0 ? (
            <div className="estado-vazio">
              <p>Nenhum free agent encontrado para esta pelada.</p>
              <p className="texto-suave">Tente outra posição ou volte a buscar mais tarde.</p>
            </div>
          ) : (
            <>
              <h3 className="subtitulo-secao">
                {resultados.length === 1
                  ? "1 free agent encontrado"
                  : `${resultados.length} free agents encontrados`}
              </h3>

              <div className="aviso-codigo">
                <span>
                  Convide alguém para <strong>{grupo.nome}</strong> com o código{" "}
                  <strong className="codigo-convite">{grupo.codigoConvite}</strong>.
                </span>
                <BotaoCopiar texto={grupo.codigoConvite} />
              </div>

              <ul className="lista-resultados">
                {resultados.map((agente) => (
                  <li key={agente.usuarioId} className="cartao-agente">
                    <div className="cartao-agente-topo">
                      <div>
                        <strong>{agente.nome}</strong>
                        {agente.apelido && <span className="texto-suave"> · {agente.apelido}</span>}
                      </div>
                      {agente.notaMedia == null ? (
                        <span className="badge-nota badge-nota--vazia">Sem avaliações</span>
                      ) : (
                        <span className="badge-nota">
                          ★ {agente.notaMedia.toFixed(1).replace(".", ",")}
                        </span>
                      )}
                    </div>
                    <p>
                      {POSICAO_ROTULO[agente.posicaoPrimaria] || agente.posicaoPrimaria}
                      {agente.posicaoSecundaria &&
                        ` · também ${POSICAO_ROTULO[agente.posicaoSecundaria] || agente.posicaoSecundaria}`}
                      {agente.pernaDominante &&
                        ` · ${PERNA_ROTULO[agente.pernaDominante] || agente.pernaDominante}`}
                    </p>
                    <p className="texto-suave">{descreverLocal(agente)}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  );
}
