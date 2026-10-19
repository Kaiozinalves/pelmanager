import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Input } from "../components/Input";
import { Button } from "../components/Button";
import { TabelasEstatisticas } from "../components/TabelasEstatisticas";
import { BuscaFreeAgentsGrupo } from "../components/BuscaFreeAgentsGrupo";
import { useAuth } from "../context/AuthContext";
import { atualizarConfiguracaoAvaliacao, buscarDetalhesGrupo } from "../api/grupo";
import {
  atualizarConfiguracaoPagamento,
  obterConfiguracaoPagamento,
} from "../api/pagamento";
import { estatisticasDoGrupo } from "../api/gol";
import { agendarRodada } from "../api/rodada";
import { extrairMensagemErro } from "../constants/enums";

const PAPEL_ROTULO = {
  ADMIN: "Admin",
  MEMBRO: "Membro",
};

const STATUS_RODADA_ROTULO = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const ENDERECO_VAZIO = {
  logradouro: "",
  numero: "",
  bairro: "",
  cidade: "",
  estado: "",
  cep: "",
};

function formatarEndereco(endereco) {
  if (!endereco || !endereco.logradouro) return null;
  const partes = [endereco.logradouro];
  if (endereco.numero) partes[0] += `, ${endereco.numero}`;
  if (endereco.bairro) partes.push(endereco.bairro);
  const cidadeUf = [endereco.cidade, endereco.estado].filter(Boolean).join("/");
  if (cidadeUf) partes.push(cidadeUf);
  if (endereco.cep) partes.push(`CEP ${endereco.cep}`);
  return partes.join(" · ");
}

function formatarMoeda(valor) {
  if (valor == null || valor === "") return "R$ 0,00";
  const num = Number(valor);
  if (Number.isNaN(num)) return "R$ 0,00";
  return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function GrupoDetalhes() {
  const { id } = useParams();
  const { usuario } = useAuth();

  const [grupo, setGrupo] = useState(null);
  const [carregando, setCarregando] = useState(true);
  const [erroCarregar, setErroCarregar] = useState(null);

  const [data, setData] = useState("");
  const [horario, setHorario] = useState("");
  const [usarEnderecoAlternativo, setUsarEnderecoAlternativo] = useState(false);
  const [enderecoAlternativo, setEnderecoAlternativo] = useState(ENDERECO_VAZIO);
  const [agendando, setAgendando] = useState(false);
  const [erroAgendar, setErroAgendar] = useState(null);
  const [rodadaRecemCriada, setRodadaRecemCriada] = useState(null);

  const [estatisticas, setEstatisticas] = useState(null);
  const [configuracao, setConfiguracao] = useState(null);
  const [salvandoConfiguracao, setSalvandoConfiguracao] = useState(false);
  const [erroConfiguracao, setErroConfiguracao] = useState(null);
  const [configuracaoSalva, setConfiguracaoSalva] = useState(false);

  const [configPagamento, setConfigPagamento] = useState({
    ativo: false,
    valorTotal: "",
    chavePixGerente: "",
  });
  const [salvandoPagamento, setSalvandoPagamento] = useState(false);
  const [erroPagamento, setErroPagamento] = useState(null);
  const [pagamentoSalvo, setPagamentoSalvo] = useState(false);

  const carregarGrupo = useCallback(async () => {
    try {
      const dados = await buscarDetalhesGrupo(id);
      setGrupo(dados);
    } catch (err) {
      setErroCarregar(extrairMensagemErro(err, "Não foi possível carregar essa pelada."));
    }
  }, [id]);

  const carregarPagamento = useCallback(async () => {
    try {
      const dados = await obterConfiguracaoPagamento(id);
      setConfigPagamento({
        ativo: Boolean(dados?.ativo),
        valorTotal: dados?.valorTotal != null ? String(dados.valorTotal) : "",
        chavePixGerente: dados?.chavePixGerente || "",
      });
    } catch {
      // mantém valores padrão caso falhe
    }
  }, [id]);

  useEffect(() => {
    setCarregando(true);
    Promise.all([carregarGrupo(), carregarPagamento()]).finally(() => setCarregando(false));
  }, [carregarGrupo, carregarPagamento]);

  const ehAdmin =
    grupo?.participantes?.find((p) => p.usuarioId === usuario.id)?.papel === "ADMIN";

  // Estatísticas (artilharia/assistências) somando todas as rodadas do grupo.
  useEffect(() => {
    estatisticasDoGrupo(id)
      .then(setEstatisticas)
      .catch(() => setEstatisticas(null));
  }, [id]);

  // Copia a configuração salva para o formulário (prazo como string para o input).
  useEffect(() => {
    const salva = grupo?.configuracaoAvaliacao;
    if (salva) {
      setConfiguracao({ ...salva, prazoHoras: String(salva.prazoHoras) });
    }
  }, [grupo]);

  function atualizarConfiguracao(campo, valor) {
    setConfiguracaoSalva(false);
    setConfiguracao((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarCampoPagamento(campo, valor) {
    setPagamentoSalvo(false);
    setErroPagamento(null);
    setConfigPagamento((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarCampoEnderecoAlt(campo, valor) {
    setErroAgendar(null);
    setEnderecoAlternativo((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSalvarConfiguracao(evento) {
    evento.preventDefault();
    setErroConfiguracao(null);
    setConfiguracaoSalva(false);

    const prazo = Number(configuracao.prazoHoras);
    if (!Number.isInteger(prazo) || prazo < 1 || prazo > 168) {
      setErroConfiguracao("Informe um prazo inteiro entre 1 e 168 horas.");
      return;
    }

    setSalvandoConfiguracao(true);
    try {
      await atualizarConfiguracaoAvaliacao(Number(id), {
        usuarioId: usuario.id,
        melhorJogadorAtiva: configuracao.melhorJogadorAtiva,
        melhorAssistenteAtiva: configuracao.melhorAssistenteAtiva,
        bagreAtiva: configuracao.bagreAtiva,
        prazoHoras: prazo,
      });
      setConfiguracaoSalva(true);
      await carregarGrupo();
    } catch (err) {
      setErroConfiguracao(extrairMensagemErro(err, "Não foi possível salvar a configuração agora."));
    } finally {
      setSalvandoConfiguracao(false);
    }
  }

  async function aoSalvarPagamento(evento) {
    evento.preventDefault();
    setErroPagamento(null);
    setPagamentoSalvo(false);

    const valorNum =
      configPagamento.valorTotal !== "" ? Number(configPagamento.valorTotal) : null;

    if (configPagamento.ativo) {
      if (valorNum == null || Number.isNaN(valorNum) || valorNum <= 0) {
        setErroPagamento("Informe um valor total maior que zero para ativar os pagamentos.");
        return;
      }
      if (!configPagamento.chavePixGerente.trim()) {
        setErroPagamento("Informe a chave PIX do organizador.");
        return;
      }
    }

    setSalvandoPagamento(true);
    try {
      const resultado = await atualizarConfiguracaoPagamento(Number(id), {
        usuarioId: usuario.id,
        ativo: configPagamento.ativo,
        valorTotal: valorNum,
        chavePixGerente: configPagamento.chavePixGerente.trim(),
      });
      setConfigPagamento({
        ativo: Boolean(resultado.ativo),
        valorTotal: resultado.valorTotal != null ? String(resultado.valorTotal) : "",
        chavePixGerente: resultado.chavePixGerente || "",
      });
      setPagamentoSalvo(true);
      await carregarGrupo();
    } catch (err) {
      setErroPagamento(
        extrairMensagemErro(err, "Não foi possível salvar a configuração de pagamento.")
      );
    } finally {
      setSalvandoPagamento(false);
    }
  }

  async function aoAgendarRodada(evento) {
    evento.preventDefault();
    setErroAgendar(null);
    setRodadaRecemCriada(null);

    if (!data || !horario) {
      setErroAgendar("Informe a data e o horário da rodada.");
      return;
    }

    if (usarEnderecoAlternativo) {
      if (!enderecoAlternativo.logradouro.trim() || !enderecoAlternativo.cidade.trim()) {
        setErroAgendar(
          "No endereço alternativo, preencha pelo menos a Rua/Av. e a Cidade."
        );
        return;
      }
    }

    setAgendando(true);
    try {
      const rodadaCriada = await agendarRodada({
        grupoId: Number(id),
        usuarioId: usuario.id,
        data,
        horario,
        enderecoAlternativo: usarEnderecoAlternativo ? enderecoAlternativo : null,
      });
      setRodadaRecemCriada(rodadaCriada);
      setData("");
      setHorario("");
      setUsarEnderecoAlternativo(false);
      setEnderecoAlternativo(ENDERECO_VAZIO);
      await carregarGrupo();
    } catch (err) {
      setErroAgendar(
        extrairMensagemErro(err, "Não foi possível agendar a rodada agora.")
      );
    } finally {
      setAgendando(false);
    }
  }

  const enderecoPadraoFormatado = formatarEndereco(grupo?.endereco);

  return (
    <div className="home">
      <header className="home-header">
        <span className="marca marca--escura">Pelada</span>
        <Link className="link-simples" to="/home">
          Voltar
        </Link>
      </header>

      <main className="pagina-central">
        {carregando && <p className="texto-suave">Carregando…</p>}

        {!carregando && erroCarregar && (
          <p className="mensagem-erro" role="alert">
            {erroCarregar}
          </p>
        )}

        {!carregando && grupo && (
          <>
            <section className="painel painel--form">
              <h2 className="painel-titulo">{grupo.nome}</h2>
              <p className="texto-suave">
                Código de convite: <strong>{grupo.codigoConvite}</strong>
              </p>
              {enderecoPadraoFormatado && (
                <p className="texto-suave" style={{ marginTop: "6px" }}>
                  Local padrão: <strong>{enderecoPadraoFormatado}</strong>
                </p>
              )}
              {configPagamento.ativo && configPagamento.valorTotal && (
                <p className="texto-suave" style={{ marginTop: "6px" }}>
                  Valor da pelada: <strong>{formatarMoeda(configPagamento.valorTotal)}</strong>{" "}
                  (rateado entre os confirmados da rodada)
                </p>
              )}

              <h3 className="subtitulo-secao">Participantes</h3>
              <ul className="lista-participantes">
                {grupo.participantes.map((participante) => (
                  <li key={participante.id} className="item-participante">
                    <span>{participante.nome || participante.apelido}</span>
                    <span
                      className={`badge-papel ${
                        participante.papel === "ADMIN" ? "badge-papel--admin" : ""
                      }`}
                    >
                      {PAPEL_ROTULO[participante.papel] || participante.papel}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="painel painel--form">
              <h2 className="painel-titulo">Rodadas</h2>

              {(!grupo.rodadas || grupo.rodadas.length === 0) && (
                <p className="texto-suave">Nenhuma rodada agendada ainda.</p>
              )}

              {grupo.rodadas && grupo.rodadas.length > 0 && (
                <ul className="lista-rodadas">
                  {grupo.rodadas.map((rodada) => {
                    const endRodada = formatarEndereco(rodada.endereco);
                    return (
                      <li key={rodada.id}>
                        <Link to={`/grupos/${id}/rodadas/${rodada.id}`} className="item-rodada">
                          <div className="item-rodada-info">
                            <span>
                              {rodada.data?.split("-").reverse().join("/")} · {rodada.horario}
                            </span>
                            {endRodada && (
                              <span className="texto-suave item-rodada-endereco">
                                📍 {endRodada}
                                {rodada.usaEnderecoAlternativo ? " (endereço alternativo)" : ""}
                              </span>
                            )}
                          </div>
                          <span className={`badge-status badge-status--${rodada.status?.toLowerCase()}`}>
                            {STATUS_RODADA_ROTULO[rodada.status] || rodada.status}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {ehAdmin && <BuscaFreeAgentsGrupo grupo={grupo} />}

            <section className="painel painel--form">
              <h2 className="painel-titulo">Estatísticas da pelada</h2>
              {estatisticas && estatisticas.totalGols > 0 ? (
                <TabelasEstatisticas estatisticas={estatisticas} />
              ) : (
                <p className="texto-suave">
                  Nenhum gol registrado ainda. As tabelas aparecem conforme os gols são lançados nas rodadas.
                </p>
              )}
            </section>

            {ehAdmin && (
              <section className="painel painel--form">
                <h2 className="painel-titulo">Sistema de pagamentos (PIX)</h2>
                <p className="texto-suave">
                  Quando ativo, ao iniciar uma rodada (fechar o check-in), o valor total da pelada é
                  dividido automaticamente entre os jogadores confirmados e cada um pode gerar seu
                  QR Code PIX.
                </p>

                <form className="formulario" onSubmit={aoSalvarPagamento} noValidate style={{ marginTop: "12px" }}>
                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={configPagamento.ativo}
                      onChange={(e) => atualizarCampoPagamento("ativo", e.target.checked)}
                    />
                    Ativar cobrança automática nas rodadas
                  </label>

                  <div className="formulario-linha">
                    <Input
                      id="pagamento-valor-total"
                      label="Valor total da pelada (R$)"
                      type="number"
                      step="0.01"
                      min="0.01"
                      placeholder="Ex.: 150.00"
                      value={configPagamento.valorTotal}
                      onChange={(e) => atualizarCampoPagamento("valorTotal", e.target.value)}
                    />
                    <Input
                      id="pagamento-chave-pix"
                      label="Chave PIX do organizador"
                      placeholder="CPF, e-mail ou +55 11 99999-9999"
                      value={configPagamento.chavePixGerente}
                      onChange={(e) => atualizarCampoPagamento("chavePixGerente", e.target.value)}
                    />
                  </div>
                  <p className="texto-suave texto-suave--nota">
                    Formatos aceitos para a chave PIX: CPF (111.111.111-11), E-mail, Telefone (+55 11 99999-9999) ou Chave aleatória.
                  </p>

                  {erroPagamento && (
                    <p className="mensagem-erro" role="alert">
                      {erroPagamento}
                    </p>
                  )}
                  {pagamentoSalvo && (
                    <p className="mensagem-sucesso" role="status">
                      Configuração de pagamento salva com sucesso!
                    </p>
                  )}

                  <Button type="submit" carregando={salvandoPagamento}>
                    Salvar configuração de pagamento
                  </Button>
                </form>
              </section>
            )}

            {ehAdmin && configuracao && (
              <section className="painel painel--form">
                <h2 className="painel-titulo">Votação de fim de rodada</h2>
                <p className="texto-suave texto-suave--nota">
                  Escolha quais categorias os jogadores votam depois que a rodada termina. A mudança vale
                  para as próximas rodadas finalizadas.
                </p>

                <form className="formulario" onSubmit={aoSalvarConfiguracao} noValidate>
                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={configuracao.melhorJogadorAtiva}
                      onChange={(e) => atualizarConfiguracao("melhorJogadorAtiva", e.target.checked)}
                    />
                    Melhor jogador da rodada
                  </label>
                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={configuracao.melhorAssistenteAtiva}
                      onChange={(e) => atualizarConfiguracao("melhorAssistenteAtiva", e.target.checked)}
                    />
                    Melhor assistente da rodada
                  </label>
                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={configuracao.bagreAtiva}
                      onChange={(e) => atualizarConfiguracao("bagreAtiva", e.target.checked)}
                    />
                    Bagre da rodada
                  </label>
                  <p className="texto-suave texto-suave--nota">
                    O “bagre” é uma brincadeira que pode soar constrangedora em alguns grupos, por isso vem
                    desligado por padrão.
                  </p>

                  <Input
                    id="prazo-votacao"
                    label="Prazo da votação (horas)"
                    type="number"
                    min="1"
                    max="168"
                    value={configuracao.prazoHoras}
                    onChange={(e) => atualizarConfiguracao("prazoHoras", e.target.value)}
                  />

                  {erroConfiguracao && (
                    <p className="mensagem-erro" role="alert">
                      {erroConfiguracao}
                    </p>
                  )}
                  {configuracaoSalva && (
                    <p className="mensagem-sucesso" role="status">
                      Configuração salva.
                    </p>
                  )}

                  <Button type="submit" carregando={salvandoConfiguracao}>
                    Salvar configuração
                  </Button>
                </form>
              </section>
            )}

            {ehAdmin && (
              <section className="painel painel--form">
                <h2 className="painel-titulo">Agendar rodada</h2>

                <form className="formulario" onSubmit={aoAgendarRodada} noValidate>
                  <div className="formulario-linha">
                    <Input
                      id="data"
                      label="Data"
                      type="date"
                      required
                      value={data}
                      onChange={(e) => setData(e.target.value)}
                    />
                    <Input
                      id="horario"
                      label="Horário"
                      type="time"
                      required
                      value={horario}
                      onChange={(e) => setHorario(e.target.value)}
                    />
                  </div>

                  <label className="opcao-checkbox">
                    <input
                      type="checkbox"
                      checked={usarEnderecoAlternativo}
                      onChange={(e) => setUsarEnderecoAlternativo(e.target.checked)}
                    />
                    Cadastrar endereço alternativo para esta rodada
                  </label>

                  {usarEnderecoAlternativo && (
                    <div className="bloco-endereco-alternativo">
                      <p className="texto-suave">
                        Preencha o local onde essa rodada será realizada (se desmarcar, será usado o endereço padrão da pelada).
                      </p>
                      <div className="formulario-linha">
                        <Input
                          id="alt-logradouro"
                          label="Rua / Av."
                          required
                          value={enderecoAlternativo.logradouro}
                          onChange={(e) => atualizarCampoEnderecoAlt("logradouro", e.target.value)}
                        />
                        <Input
                          id="alt-numero"
                          label="Número"
                          value={enderecoAlternativo.numero}
                          onChange={(e) => atualizarCampoEnderecoAlt("numero", e.target.value)}
                        />
                      </div>
                      <div className="formulario-linha">
                        <Input
                          id="alt-bairro"
                          label="Bairro"
                          value={enderecoAlternativo.bairro}
                          onChange={(e) => atualizarCampoEnderecoAlt("bairro", e.target.value)}
                        />
                        <Input
                          id="alt-cidade"
                          label="Cidade"
                          required
                          value={enderecoAlternativo.cidade}
                          onChange={(e) => atualizarCampoEnderecoAlt("cidade", e.target.value)}
                        />
                      </div>
                      <div className="formulario-linha">
                        <Input
                          id="alt-estado"
                          label="UF"
                          maxLength={2}
                          value={enderecoAlternativo.estado}
                          onChange={(e) =>
                            atualizarCampoEnderecoAlt("estado", e.target.value.toUpperCase())
                          }
                        />
                        <Input
                          id="alt-cep"
                          label="CEP"
                          value={enderecoAlternativo.cep}
                          onChange={(e) => atualizarCampoEnderecoAlt("cep", e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {erroAgendar && (
                    <p className="mensagem-erro" role="alert">
                      {erroAgendar}
                    </p>
                  )}
                  {rodadaRecemCriada && (
                    <p className="mensagem-sucesso" role="status">
                      Rodada agendada!{" "}
                      <Link to={`/grupos/${id}/rodadas/${rodadaRecemCriada.id}`}>
                        Ir pra rodada
                      </Link>
                    </p>
                  )}

                  <Button type="submit" carregando={agendando}>
                    Agendar
                  </Button>
                </form>
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}
