import { useCallback, useEffect, useState } from "react";
import { Button } from "./Button";
import { Select } from "./Input";
import { TabelasEstatisticas } from "./TabelasEstatisticas";
import {
  corrigirGol,
  estatisticasDaRodada,
  listarGols,
  registrarGol,
  removerGol,
} from "../api/gol";
import { extrairMensagemErro } from "../constants/enums";

const nomeDe = (jogador) => jogador?.nome || jogador?.apelido || "";

// Gols e assistências da rodada.
// - Registrar: admin ou quem confirmou presença, com a rodada em andamento
//   (admin também depois de finalizada).
// - Corrigir/remover: só admin. O backend revalida tudo; aqui só escondemos o que
//   o usuário não pode fazer.
export function GolsRodada({ rodadaId, status, usuarioId, ehAdmin, jogadores, times }) {
  const [gols, setGols] = useState([]);
  const [estatisticas, setEstatisticas] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const [autorId, setAutorId] = useState("");
  const [assistenteId, setAssistenteId] = useState("");
  const [salvando, setSalvando] = useState(false);

  const [editandoId, setEditandoId] = useState(null);
  const [edicao, setEdicao] = useState({ autorId: "", assistenteId: "" });
  const [trabalhandoId, setTrabalhandoId] = useState(null);

  const euConfirmei = jogadores.some((j) => j.usuarioId === usuarioId);
  const podeRegistrar =
    status === "EM_ANDAMENTO" ? ehAdmin || euConfirmei : status === "FINALIZADA" && ehAdmin;
  const timePorJogador = new Map(
    (times || []).flatMap((time) => time.jogadores.map((jogador) => [String(jogador.usuarioId), time.id]))
  );

  function assistentesDoMesmoTime(autorJogadorId) {
    const timeAutorId = timePorJogador.get(String(autorJogadorId));
    if (timeAutorId == null) return [];

    return jogadores.filter(
      (jogador) =>
        String(jogador.usuarioId) !== String(autorJogadorId) &&
        timePorJogador.get(String(jogador.usuarioId)) === timeAutorId
    );
  }

  function aoTrocarAutor(autorJogadorId) {
    setAutorId(autorJogadorId);
    if (!assistentesDoMesmoTime(autorJogadorId).some((jogador) => String(jogador.usuarioId) === assistenteId)) {
      setAssistenteId("");
    }
  }

  function aoTrocarAutorEdicao(autorJogadorId) {
    setEdicao((atual) => ({
      autorId: autorJogadorId,
      assistenteId: assistentesDoMesmoTime(autorJogadorId).some(
        (jogador) => String(jogador.usuarioId) === atual.assistenteId
      )
        ? atual.assistenteId
        : "",
    }));
  }

  const carregar = useCallback(async () => {
    try {
      const [listaGols, stats] = await Promise.all([
        listarGols(rodadaId),
        estatisticasDaRodada(rodadaId),
      ]);
      setGols(listaGols);
      setEstatisticas(stats);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível carregar os gols dessa rodada."));
    }
  }, [rodadaId]);

  useEffect(() => {
    setCarregando(true);
    carregar().finally(() => setCarregando(false));
  }, [carregar]);

  async function aoRegistrar(evento) {
    evento.preventDefault();
    setErro(null);
    if (!autorId) {
      setErro("Escolha quem fez o gol.");
      return;
    }
    setSalvando(true);
    try {
      await registrarGol(rodadaId, {
        usuarioId,
        autorId: Number(autorId),
        assistenteId: assistenteId ? Number(assistenteId) : null,
      });
      setAutorId("");
      setAssistenteId("");
      await carregar();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível registrar o gol agora."));
    } finally {
      setSalvando(false);
    }
  }

  function comecarEdicao(gol) {
    setErro(null);
    setEditandoId(gol.id);
    const autorGolId = String(gol.autor.usuarioId);
    const assistenteGolId = gol.assistente ? String(gol.assistente.usuarioId) : "";
    setEdicao({
      autorId: autorGolId,
      assistenteId: assistentesDoMesmoTime(autorGolId).some(
        (jogador) => String(jogador.usuarioId) === assistenteGolId
      )
        ? assistenteGolId
        : "",
    });
  }

  async function aoSalvarEdicao(evento, golId) {
    evento.preventDefault();
    setErro(null);
    setTrabalhandoId(golId);
    try {
      await corrigirGol(rodadaId, golId, {
        usuarioId,
        autorId: Number(edicao.autorId),
        assistenteId: edicao.assistenteId ? Number(edicao.assistenteId) : null,
      });
      setEditandoId(null);
      await carregar();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível corrigir o gol agora."));
    } finally {
      setTrabalhandoId(null);
    }
  }

  async function aoRemover(golId) {
    setErro(null);
    setTrabalhandoId(golId);
    try {
      await removerGol(rodadaId, golId, usuarioId);
      await carregar();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível remover o gol agora."));
    } finally {
      setTrabalhandoId(null);
    }
  }

  const opcoesJogadores = jogadores.map((j) => (
    <option key={j.usuarioId} value={j.usuarioId}>
      {nomeDe(j)}
    </option>
  ));

  return (
    <section className="painel">
      <h3 className="subtitulo-secao">Gols e assistências</h3>

      {erro && (
        <p className="mensagem-erro" role="alert">
          {erro}
        </p>
      )}

      {podeRegistrar && (
        <form className="formulario-gol" onSubmit={aoRegistrar} noValidate>
          <Select id="gol-autor" label="Quem fez o gol" value={autorId} onChange={(e) => aoTrocarAutor(e.target.value)}>
            <option value="">Selecione…</option>
            {opcoesJogadores}
          </Select>
          <Select
            id="gol-assistente"
            label="Assistência (opcional)"
            value={assistenteId}
            onChange={(e) => setAssistenteId(e.target.value)}
          >
            <option value="">Sem assistência</option>
            {assistentesDoMesmoTime(autorId).map((j) => (
              <option key={j.usuarioId} value={j.usuarioId}>
                {nomeDe(j)}
              </option>
            ))}
          </Select>
          <p className="texto-suave texto-suave--nota">
            A assistência só pode ser atribuída a alguém do mesmo time. Sorteie os times primeiro.
          </p>
          <Button type="submit" carregando={salvando}>
            Registrar gol
          </Button>
        </form>
      )}

      {!podeRegistrar && status === "EM_ANDAMENTO" && (
        <p className="texto-suave">Só quem confirmou presença pode registrar gols.</p>
      )}
      {!podeRegistrar && status === "FINALIZADA" && (
        <p className="texto-suave">A rodada terminou. Só um admin pode ajustar os gols agora.</p>
      )}

      {carregando && <p className="texto-suave">Carregando…</p>}

      {!carregando && gols.length === 0 && <p className="texto-suave">Nenhum gol registrado ainda.</p>}

      {!carregando && gols.length > 0 && (
        <ul className="lista-gols">
          {gols.map((gol, indice) => (
            <li key={gol.id} className="item-gol">
              {editandoId === gol.id ? (
                <form className="formulario-gol" onSubmit={(e) => aoSalvarEdicao(e, gol.id)} noValidate>
                  <Select
                    id={`edit-autor-${gol.id}`}
                    label="Autor"
                    value={edicao.autorId}
                    onChange={(e) => aoTrocarAutorEdicao(e.target.value)}
                  >
                    {opcoesJogadores}
                  </Select>
                  <Select
                    id={`edit-assistente-${gol.id}`}
                    label="Assistência"
                    value={edicao.assistenteId}
                    onChange={(e) => setEdicao((atual) => ({ ...atual, assistenteId: e.target.value }))}
                  >
                    <option value="">Sem assistência</option>
                    {assistentesDoMesmoTime(edicao.autorId).map((j) => (
                      <option key={j.usuarioId} value={j.usuarioId}>
                        {nomeDe(j)}
                      </option>
                    ))}
                  </Select>
                  <div className="linha-acoes">
                    <Button type="submit" carregando={trabalhandoId === gol.id}>
                      Salvar
                    </Button>
                    <Button type="button" variante="secundario" onClick={() => setEditandoId(null)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="item-gol-info">
                    <span>
                      <strong>Gol {indice + 1}:</strong> {nomeDe(gol.autor)}
                      {gol.assistente && (
                        <span className="texto-suave"> · assistência de {nomeDe(gol.assistente)}</span>
                      )}
                    </span>
                    <span className="texto-suave texto-suave--nota">
                      Registrado por {gol.registradoPorNome}
                      {gol.corrigido && ` · corrigido por ${gol.corrigidoPorNome}`}
                    </span>
                  </div>
                  {ehAdmin && (
                    <div className="linha-acoes">
                      <Button type="button" variante="secundario" onClick={() => comecarEdicao(gol)}>
                        Corrigir
                      </Button>
                      <Button
                        type="button"
                        variante="secundario"
                        carregando={trabalhandoId === gol.id}
                        onClick={() => aoRemover(gol.id)}
                      >
                        Remover
                      </Button>
                    </div>
                  )}
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {!carregando && <TabelasEstatisticas estatisticas={estatisticas} />}
    </section>
  );
}
