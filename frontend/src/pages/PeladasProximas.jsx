import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { BotaoCopiar } from "../components/BotaoCopiar";
import { listarMeusGrupos } from "../api/grupo";
import { buscarPeladasProximas } from "../api/peladaProxima";
import { extrairMensagemErro } from "../constants/enums";

const FILTROS_INICIAIS = { cidade: "", estado: "", bairro: "" };

function formatarData(iso) {
  return iso ? iso.split("-").reverse().join("/") : "";
}

function plural(quantidade, singular, pluralTexto) {
  return `${quantidade} ${quantidade === 1 ? singular : pluralTexto}`;
}

export function PeladasProximas() {
  const { usuario } = useAuth();

  const [filtros, setFiltros] = useState(FILTROS_INICIAIS);
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState(null);
  const [resultados, setResultados] = useState(null); // null = ainda não buscou
  const [cidadeBuscada, setCidadeBuscada] = useState("");

  // O cadastro do usuário não tem endereço, então sugerimos a cidade da primeira
  // pelada dele. Só preenche se o campo ainda estiver vazio (não atropela o que
  // a pessoa já digitou).
  useEffect(() => {
    let ativo = true;
    listarMeusGrupos(usuario.id)
      .then((grupos) => {
        if (!ativo) return;
        const comCidade = grupos.find((g) => g.endereco?.cidade);
        if (comCidade) {
          setFiltros((atual) =>
            atual.cidade
              ? atual
              : {
                  ...atual,
                  cidade: comCidade.endereco.cidade,
                  estado: comCidade.endereco.estado || "",
                }
          );
        }
      })
      .catch(() => {
        // sem sugestão de cidade; a pessoa digita
      });
    return () => {
      ativo = false;
    };
  }, [usuario.id]);

  function atualizarFiltro(campo, valor) {
    setFiltros((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoBuscar(evento) {
    evento.preventDefault();
    setErro(null);

    const cidade = filtros.cidade.trim();
    if (!cidade) {
      setErro("Informe a cidade pra buscar.");
      return;
    }

    setBuscando(true);
    try {
      const lista = await buscarPeladasProximas({
        cidade,
        estado: filtros.estado.trim(),
        bairro: filtros.bairro.trim(),
        usuarioId: usuario.id,
      });
      setResultados(lista);
      setCidadeBuscada(cidade);
    } catch (err) {
      setErro(
        extrairMensagemErro(err, "Não foi possível buscar peladas agora. Tenta de novo em instantes.")
      );
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="home">
      <header className="home-header">
        <span className="marca marca--escura">Pelada</span>
        <Link className="link-simples" to="/home">
          Voltar
        </Link>
      </header>

      <main className="pagina-central pagina-central--larga">
        <section className="painel">
          <h2 className="painel-titulo">Buscar peladas</h2>
          <p className="texto-suave">
            Peladas públicas com rodada marcada na sua cidade. Pra entrar em uma, use o código de
            convite dela.
          </p>

          <form className="formulario" onSubmit={aoBuscar} noValidate>
            <div className="formulario-linha formulario-linha--uf">
              <Input
                id="busca-cidade"
                label="Cidade"
                required
                value={filtros.cidade}
                onChange={(e) => atualizarFiltro("cidade", e.target.value)}
              />
              <Input
                id="busca-estado"
                label="UF"
                maxLength={2}
                value={filtros.estado}
                onChange={(e) => atualizarFiltro("estado", e.target.value.toUpperCase())}
              />
            </div>

            <Input
              id="busca-bairro"
              label="Bairro (opcional)"
              placeholder="As do mesmo bairro aparecem primeiro"
              value={filtros.bairro}
              onChange={(e) => atualizarFiltro("bairro", e.target.value)}
            />

            {erro && (
              <p className="mensagem-erro" role="alert">
                {erro}
              </p>
            )}

            <Button type="submit" carregando={buscando}>
              Buscar peladas
            </Button>
          </form>
        </section>

        {resultados && (
          <section className="painel" aria-live="polite">
            {resultados.length === 0 ? (
              <div className="estado-vazio">
                <p>Nenhuma pelada pública com rodada marcada em {cidadeBuscada}.</p>
                <p className="texto-suave">
                  Confira a grafia da cidade, tire o filtro de bairro ou crie a sua pelada na tela
                  inicial.
                </p>
              </div>
            ) : (
              <>
                <h2 className="painel-titulo">
                  {resultados.length === 1
                    ? `1 pelada encontrada em ${cidadeBuscada}`
                    : `${resultados.length} peladas encontradas em ${cidadeBuscada}`}
                </h2>

                <ul className="lista-resultados">
                  {resultados.map((pelada) => (
                    <li key={pelada.rodadaId} className="cartao-pelada">
                      <div className="cartao-pelada-topo">
                        <h3 className="cartao-pelada-nome">{pelada.grupoNome}</h3>
                        {pelada.mesmoBairro && <span className="badge-destaque">Mesmo bairro</span>}
                      </div>

                      <p className="cartao-pelada-quando">
                        {formatarData(pelada.data)} · {pelada.horario}
                      </p>
                      <p>{pelada.endereco}</p>
                      <p className="texto-suave">
                        {plural(pelada.totalParticipantes, "participante", "participantes")} ·{" "}
                        {plural(pelada.totalConfirmados, "confirmado", "confirmados")} nessa rodada
                      </p>

                      <div className="cartao-pelada-codigo">
                        <span>
                          Código de convite:{" "}
                          <strong className="codigo-convite">{pelada.codigoConvite}</strong>
                        </span>
                        <div className="linha-acoes">
                          <BotaoCopiar texto={pelada.codigoConvite} />
                          <Link
                            className="botao botao--primario botao--pequeno"
                            to="/home"
                            state={{ codigoConvite: pelada.codigoConvite }}
                          >
                            Usar este código
                          </Link>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
