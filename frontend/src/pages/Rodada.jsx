import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { BotaoCopiar } from "../components/BotaoCopiar";
import { GolsRodada } from "../components/GolsRodada";
import { buscarDetalhesGrupo } from "../api/grupo";
import {
  atualizarEnderecoDaRodada,
  encerrarVotacao,
  finalizarRodada,
  iniciarRodada,
  removerEnderecoAlternativoDaRodada,
} from "../api/rodada";
import { buscarVotacao } from "../api/votacao";
import {
  cancelarPresenca,
  confirmarPresenca,
  confirmarTodos,
  listarCheckinsDaRodada,
} from "../api/checkin";
import {
  gerarPagamentosDaRodada,
  listarPagamentosDaRodada,
  marcarPagamentoComoPago,
  obterConfiguracaoPagamento,
  obterQrCodePagamento,
  registrarDesistenciaRodada,
} from "../api/pagamento";
import { buscarTimesDaRodada, sortearAleatorio, sortearBalanceado } from "../api/sorteio";
import { POSICOES, extrairMensagemErro } from "../constants/enums";

const POSICAO_ROTULO = Object.fromEntries(POSICOES.map((p) => [p.valor, p.rotulo]));

const STATUS_ROTULO = {
  AGENDADA: "Agendada",
  EM_ANDAMENTO: "Em andamento",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

const STATUS_PAGAMENTO_ROTULO = {
  PENDENTE: "Pendente",
  PAGO: "Pago",
  CANCELADO: "Cancelado",
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

export function Rodada() {
  const { grupoId, rodadaId } = useParams();
  const navigate = useNavigate();
  const { usuario } = useAuth();
  const rodadaIdNum = Number(rodadaId);

  const [grupo, setGrupo] = useState(null);
  const [carregandoGrupo, setCarregandoGrupo] = useState(true);
  const [erroGrupo, setErroGrupo] = useState(null);

  // Endereço alternativo da rodada
  const [editandoEndereco, setEditandoEndereco] = useState(false);
  const [formEndereco, setFormEndereco] = useState(ENDERECO_VAZIO);
  const [salvandoEndereco, setSalvandoEndereco] = useState(false);
  const [erroEndereco, setErroEndereco] = useState(null);
  const [sucessoEndereco, setSucessoEndereco] = useState(null);

  const [checkins, setCheckins] = useState([]);
  const [carregandoCheckins, setCarregandoCheckins] = useState(true);
  const [fazendoCheckin, setFazendoCheckin] = useState(false);
  const [cancelandoCheckin, setCancelandoCheckin] = useState(false);
  const [confirmandoTodos, setConfirmandoTodos] = useState(false);
  const [erroCheckin, setErroCheckin] = useState(null);

  const [times, setTimes] = useState([]);
  const [carregandoTimes, setCarregandoTimes] = useState(true);
  const [sorteando, setSorteando] = useState(null); // "aleatorio" | "balanceado" | null
  const [erroSorteio, setErroSorteio] = useState(null);

  const [iniciando, setIniciando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [encerrandoVotacao, setEncerrandoVotacao] = useState(false);
  const [votacao, setVotacao] = useState(null);
  const [erroTransicao, setErroTransicao] = useState(null);

  // Pagamentos
  const [configPagamento, setConfigPagamento] = useState(null);
  const [pagamentos, setPagamentos] = useState([]);
  const [carregandoPagamentos, setCarregandoPagamentos] = useState(true);
  const [erroPagamento, setErroPagamento] = useState(null);
  const [gerandoPagamentos, setGerandoPagamentos] = useState(false);
  const [marcandoPagoId, setMarcandoPagoId] = useState(null);
  const [desistenciaId, setDesistenciaId] = useState(null);
  const [filtroPagamento, setFiltroPagamento] = useState("TODOS"); // "TODOS" | "PENDENTES" | "PAGOS"

  // QR Code PIX
  const [qrCodePagamentoId, setQrCodePagamentoId] = useState(null);
  const [qrCodeDados, setQrCodeDados] = useState(null);
  const [carregandoQrCode, setCarregandoQrCode] = useState(false);
  const [erroQrCode, setErroQrCode] = useState(null);

  const rodada = grupo?.rodadas?.find((r) => r.id === rodadaIdNum) || null;
  const ehAdmin =
    grupo?.participantes?.find((p) => p.usuarioId === usuario.id)?.papel === "ADMIN";
  const jogadoresConfirmados = checkins.filter((c) => c.statusCheckIn === "CONFIRMADO");

  const carregarGrupo = useCallback(async () => {
    try {
      const dados = await buscarDetalhesGrupo(grupoId);
      setGrupo(dados);
      if (dados?.configuracaoPagamento) {
        setConfigPagamento(dados.configuracaoPagamento);
      }
    } catch (err) {
      setErroGrupo(extrairMensagemErro(err, "Não foi possível carregar essa pelada."));
    }
  }, [grupoId]);

  const carregarConfigPagamento = useCallback(async () => {
    try {
      const cfg = await obterConfiguracaoPagamento(grupoId);
      setConfigPagamento(cfg);
    } catch {
      // ignora se não houver
    }
  }, [grupoId]);

  const carregarCheckins = useCallback(async () => {
    try {
      const dados = await listarCheckinsDaRodada(rodadaIdNum);
      setCheckins(dados);
    } catch {
      setCheckins([]);
    }
  }, [rodadaIdNum]);

  const carregarPagamentos = useCallback(async () => {
    try {
      const dados = await listarPagamentosDaRodada(rodadaIdNum);
      setPagamentos(Array.isArray(dados) ? dados : []);
    } catch {
      setPagamentos([]);
    }
  }, [rodadaIdNum]);

  const carregarTimes = useCallback(async () => {
    try {
      const resultado = await buscarTimesDaRodada(rodadaIdNum);
      setTimes(resultado.times || []);
    } catch {
      setTimes([]);
    }
  }, [rodadaIdNum]);

  const carregarVotacao = useCallback(async () => {
    try {
      const dados = await buscarVotacao(rodadaIdNum, usuario.id);
      setVotacao(dados);
    } catch {
      setVotacao(null);
    }
  }, [rodadaIdNum, usuario.id]);

  useEffect(() => {
    setCarregandoGrupo(true);
    Promise.all([carregarGrupo(), carregarConfigPagamento()]).finally(() =>
      setCarregandoGrupo(false)
    );
  }, [carregarGrupo, carregarConfigPagamento]);

  useEffect(() => {
    setCarregandoCheckins(true);
    carregarCheckins().finally(() => setCarregandoCheckins(false));
    setCarregandoTimes(true);
    carregarTimes().finally(() => setCarregandoTimes(false));
    setCarregandoPagamentos(true);
    carregarPagamentos().finally(() => setCarregandoPagamentos(false));
    carregarVotacao();
  }, [carregarCheckins, carregarTimes, carregarPagamentos, carregarVotacao]);

  const meuCheckin = checkins.find((c) => c.usuarioId === usuario.id);
  const jaConfirmou = meuCheckin?.statusCheckIn === "CONFIRMADO";

  function abrirEdicaoEndereco() {
    const endAtual = rodada?.endereco || grupo?.endereco || ENDERECO_VAZIO;
    setFormEndereco({
      logradouro: endAtual.logradouro || "",
      numero: endAtual.numero || "",
      bairro: endAtual.bairro || "",
      cidade: endAtual.cidade || "",
      estado: endAtual.estado || "",
      cep: endAtual.cep || "",
    });
    setErroEndereco(null);
    setSucessoEndereco(null);
    setEditandoEndereco(true);
  }

  async function aoSalvarEnderecoAlternativo(evento) {
    evento.preventDefault();
    setErroEndereco(null);
    setSucessoEndereco(null);

    if (!formEndereco.logradouro.trim() || !formEndereco.cidade.trim()) {
      setErroEndereco("Preencha pelo menos a Rua/Av. e a Cidade do endereço alternativo.");
      return;
    }

    setSalvandoEndereco(true);
    try {
      await atualizarEnderecoDaRodada(rodadaIdNum, formEndereco, usuario.id);
      await carregarGrupo();
      setEditandoEndereco(false);
      setSucessoEndereco("Endereço alternativo da rodada salvo com sucesso!");
    } catch (err) {
      setErroEndereco(
        extrairMensagemErro(err, "Não foi possível salvar o endereço alternativo.")
      );
    } finally {
      setSalvandoEndereco(false);
    }
  }

  async function aoRestaurarEnderecoPadrao() {
    setErroEndereco(null);
    setSucessoEndereco(null);
    setSalvandoEndereco(true);
    try {
      await removerEnderecoAlternativoDaRodada(rodadaIdNum, usuario.id);
      await carregarGrupo();
      setEditandoEndereco(false);
      setSucessoEndereco("A rodada voltou a usar o endereço padrão da pelada.");
    } catch (err) {
      setErroEndereco(
        extrairMensagemErro(err, "Não foi possível restaurar o endereço padrão.")
      );
    } finally {
      setSalvandoEndereco(false);
    }
  }

  async function aoConfirmarPresenca() {
    setErroCheckin(null);
    setFazendoCheckin(true);
    try {
      await confirmarPresenca({ rodadaId: rodadaIdNum, usuarioId: usuario.id });
      await Promise.all([carregarCheckins(), carregarPagamentos()]);
    } catch (err) {
      setErroCheckin(extrairMensagemErro(err, "Não foi possível confirmar sua presença agora."));
    } finally {
      setFazendoCheckin(false);
    }
  }

  async function aoCancelarPresenca() {
    setErroCheckin(null);
    setCancelandoCheckin(true);
    try {
      await cancelarPresenca({ rodadaId: rodadaIdNum, usuarioId: usuario.id });
      await Promise.all([carregarCheckins(), carregarPagamentos(), carregarGrupo()]);
    } catch (err) {
      setErroCheckin(extrairMensagemErro(err, "Não foi possível cancelar sua presença agora."));
    } finally {
      setCancelandoCheckin(false);
    }
  }

  async function aoConfirmarTodos() {
    setErroCheckin(null);
    setConfirmandoTodos(true);
    try {
      await confirmarTodos({ rodadaId: rodadaIdNum, usuarioId: usuario.id });
      await Promise.all([carregarCheckins(), carregarPagamentos()]);
    } catch (err) {
      setErroCheckin(extrairMensagemErro(err, "Não foi possível confirmar todos os membros agora."));
    } finally {
      setConfirmandoTodos(false);
    }
  }

  async function aoSortear(modo) {
    setErroSorteio(null);
    setSorteando(modo);
    try {
      const resultado =
        modo === "aleatorio"
          ? await sortearAleatorio(rodadaIdNum, usuario.id)
          : await sortearBalanceado(rodadaIdNum, usuario.id);
      setTimes(resultado.times || []);
    } catch (err) {
      setErroSorteio(
        extrairMensagemErro(
          err,
          "Não foi possível sortear os times agora. Confira se há jogadores e goleiros suficientes confirmados."
        )
      );
    } finally {
      setSorteando(null);
    }
  }

  async function aoIniciarRodada() {
    setErroTransicao(null);
    setIniciando(true);
    try {
      await iniciarRodada(rodadaIdNum, usuario.id);
      await Promise.all([carregarGrupo(), carregarPagamentos()]);
    } catch (err) {
      setErroTransicao(extrairMensagemErro(err, "Não foi possível iniciar a rodada agora."));
    } finally {
      setIniciando(false);
    }
  }

  async function aoFinalizarRodada() {
    setErroTransicao(null);
    setFinalizando(true);
    try {
      await finalizarRodada(rodadaIdNum, usuario.id);
      navigate(`/grupos/${grupoId}/rodadas/${rodadaIdNum}/wrapped`);
    } catch (err) {
      setErroTransicao(extrairMensagemErro(err, "Não foi possível finalizar a rodada agora."));
    } finally {
      setFinalizando(false);
    }
  }

  async function aoEncerrarVotacao() {
    setErroTransicao(null);
    setEncerrandoVotacao(true);
    try {
      await encerrarVotacao(rodadaIdNum, usuario.id);
      await carregarVotacao();
    } catch (err) {
      setErroTransicao(extrairMensagemErro(err, "Não foi possível finalizar a votação agora."));
    } finally {
      setEncerrandoVotacao(false);
    }
  }

  async function aoGerarPagamentos() {
    setErroPagamento(null);
    setGerandoPagamentos(true);
    try {
      const lista = await gerarPagamentosDaRodada(rodadaIdNum, usuario.id);
      setPagamentos(Array.isArray(lista) ? lista : []);
      await carregarGrupo();
    } catch (err) {
      setErroPagamento(
        extrairMensagemErro(err, "Não foi possível gerar os pagamentos da rodada.")
      );
    } finally {
      setGerandoPagamentos(false);
    }
  }

  async function aoMarcarPago(pagamentoId) {
    setErroPagamento(null);
    setMarcandoPagoId(pagamentoId);
    try {
      await marcarPagamentoComoPago(pagamentoId, usuario.id);
      await carregarPagamentos();
      if (qrCodePagamentoId === pagamentoId) {
        setQrCodePagamentoId(null);
        setQrCodeDados(null);
      }
    } catch (err) {
      setErroPagamento(
        extrairMensagemErro(err, "Não foi possível confirmar o pagamento agora.")
      );
    } finally {
      setMarcandoPagoId(null);
    }
  }

  async function aoRegistrarDesistencia(usuarioAlvoId) {
    setErroPagamento(null);
    setDesistenciaId(usuarioAlvoId);
    try {
      const lista = await registrarDesistenciaRodada(rodadaIdNum, usuarioAlvoId, usuario.id);
      setPagamentos(Array.isArray(lista) ? lista : []);
      await Promise.all([carregarCheckins(), carregarGrupo()]);
    } catch (err) {
      setErroPagamento(
        extrairMensagemErro(err, "Não foi possível registrar a desistência e recalcular.")
      );
    } finally {
      setDesistenciaId(null);
    }
  }

  async function aoAbrirQrCode(pagamentoId) {
    if (qrCodePagamentoId === pagamentoId && qrCodeDados) {
      setQrCodePagamentoId(null);
      setQrCodeDados(null);
      return;
    }
    setErroQrCode(null);
    setQrCodePagamentoId(pagamentoId);
    setQrCodeDados(null);
    setCarregandoQrCode(true);
    try {
      const dados = await obterQrCodePagamento(pagamentoId);
      setQrCodeDados(dados);
    } catch (err) {
      setErroQrCode(
        extrairMensagemErro(
          err,
          "Não foi possível gerar o QR Code PIX. Verifique se a chave PIX foi configurada na pelada."
        )
      );
    } finally {
      setCarregandoQrCode(false);
    }
  }

  const enderecoDaRodada = rodada?.endereco || grupo?.endereco || null;
  const enderecoFormatado = formatarEndereco(enderecoDaRodada);

  // Dados de pagamento
  const sistemaPagamentoAtivo = Boolean(configPagamento?.ativo) || pagamentos.length > 0;
  const valorTotalGrupo = configPagamento?.valorTotal ? Number(configPagamento.valorTotal) : 0;

  const pagamentosAtivos = pagamentos.filter((p) => p.status !== "CANCELADO");
  const pagamentosPagos = pagamentos.filter((p) => p.status === "PAGO");
  const pagamentosPendentes = pagamentos.filter((p) => p.status === "PENDENTE");

  const valorPorPessoaCalculado =
    rodada?.valorPorParticipante != null && Number(rodada.valorPorParticipante) > 0
      ? Number(rodada.valorPorParticipante)
      : pagamentosPendentes[0]?.valor != null
      ? Number(pagamentosPendentes[0].valor)
      : jogadoresConfirmados.length > 0 && valorTotalGrupo > 0
      ? valorTotalGrupo / jogadoresConfirmados.length
      : 0;

  const totalRecebido = pagamentosPagos.reduce((acc, p) => acc + Number(p.valor || 0), 0);

  const meuPagamento = pagamentos.find(
    (p) => (p.usuarioId || p.usuario?.id) === usuario.id
  );

  const pagamentosFiltrados = pagamentos.filter((p) => {
    if (filtroPagamento === "PENDENTES") return p.status === "PENDENTE";
    if (filtroPagamento === "PAGOS") return p.status === "PAGO";
    return true;
  });

  return (
    <div className="home">
      <header className="home-header">
        <span className="marca marca--escura">Pelada</span>
        <Link className="link-simples" to={`/grupos/${grupoId}`}>
          Voltar pra pelada
        </Link>
      </header>

      <main className="pagina-central pagina-central--larga">
        {carregandoGrupo && <p className="texto-suave">Carregando…</p>}
        {!carregandoGrupo && erroGrupo && (
          <p className="mensagem-erro" role="alert">
            {erroGrupo}
          </p>
        )}

        {!carregandoGrupo && grupo && !rodada && (
          <p className="mensagem-erro" role="alert">
            Essa rodada não foi encontrada nessa pelada.
          </p>
        )}

        {!carregandoGrupo && rodada && (
          <>
            <section className="painel">
              <div className="rodada-cabecalho">
                <div>
                  <h2 className="painel-titulo">Rodada de {rodada.data?.split("-").reverse().join("/")}</h2>
                  <p className="texto-suave">{grupo.nome} · {rodada.horario}</p>
                </div>
                <span className={`badge-status badge-status--${rodada.status?.toLowerCase()}`}>
                  {STATUS_ROTULO[rodada.status] || rodada.status}
                </span>
              </div>

              {/* Endereço da rodada visível no topo para todos os usuários */}
              <div className="rodada-endereco-card">
                <div className="rodada-endereco-topo">
                  <div>
                    <div className="rodada-endereco-titulo">
                      <strong>📍 Local da rodada</strong>
                      {rodada.usaEnderecoAlternativo ? (
                        <span className="badge-destaque">Endereço alternativo</span>
                      ) : (
                        <span className="badge-papel">Endereço padrão da pelada</span>
                      )}
                    </div>
                    <p className="rodada-endereco-texto">
                      {enderecoFormatado || "Endereço não informado."}
                    </p>
                  </div>

                  {ehAdmin &&
                    !editandoEndereco &&
                    rodada.status !== "FINALIZADA" &&
                    rodada.status !== "CANCELADA" && (
                      <div className="linha-acoes">
                        <button
                          type="button"
                          className="botao botao--secundario botao--pequeno"
                          onClick={abrirEdicaoEndereco}
                        >
                          {rodada.usaEnderecoAlternativo
                            ? "Alterar endereço alternativo"
                            : "Cadastrar endereço alternativo"}
                        </button>
                        {rodada.usaEnderecoAlternativo && (
                          <button
                            type="button"
                            className="link-simples"
                            disabled={salvandoEndereco}
                            onClick={aoRestaurarEnderecoPadrao}
                          >
                            Usar endereço padrão
                          </button>
                        )}
                      </div>
                    )}
                </div>

                {sucessoEndereco && (
                  <p className="mensagem-sucesso" role="status" style={{ marginTop: "10px" }}>
                    {sucessoEndereco}
                  </p>
                )}
                {erroEndereco && !editandoEndereco && (
                  <p className="mensagem-erro" role="alert" style={{ marginTop: "10px" }}>
                    {erroEndereco}
                  </p>
                )}

                {ehAdmin && editandoEndereco && (
                  <form
                    className="formulario rodada-endereco-form"
                    onSubmit={aoSalvarEnderecoAlternativo}
                    noValidate
                  >
                    <div className="formulario-linha">
                      <Input
                        id="rodada-logradouro"
                        label="Rua / Av."
                        required
                        value={formEndereco.logradouro}
                        onChange={(e) =>
                          setFormEndereco((atual) => ({ ...atual, logradouro: e.target.value }))
                        }
                      />
                      <Input
                        id="rodada-numero"
                        label="Número"
                        value={formEndereco.numero}
                        onChange={(e) =>
                          setFormEndereco((atual) => ({ ...atual, numero: e.target.value }))
                        }
                      />
                    </div>
                    <div className="formulario-linha">
                      <Input
                        id="rodada-bairro"
                        label="Bairro"
                        value={formEndereco.bairro}
                        onChange={(e) =>
                          setFormEndereco((atual) => ({ ...atual, bairro: e.target.value }))
                        }
                      />
                      <Input
                        id="rodada-cidade"
                        label="Cidade"
                        required
                        value={formEndereco.cidade}
                        onChange={(e) =>
                          setFormEndereco((atual) => ({ ...atual, cidade: e.target.value }))
                        }
                      />
                    </div>
                    <div className="formulario-linha">
                      <Input
                        id="rodada-estado"
                        label="UF"
                        maxLength={2}
                        value={formEndereco.estado}
                        onChange={(e) =>
                          setFormEndereco((atual) => ({
                            ...atual,
                            estado: e.target.value.toUpperCase(),
                          }))
                        }
                      />
                      <Input
                        id="rodada-cep"
                        label="CEP"
                        value={formEndereco.cep}
                        onChange={(e) =>
                          setFormEndereco((atual) => ({ ...atual, cep: e.target.value }))
                        }
                      />
                    </div>

                    {erroEndereco && (
                      <p className="mensagem-erro" role="alert">
                        {erroEndereco}
                      </p>
                    )}

                    <div className="linha-acoes">
                      <Button type="submit" carregando={salvandoEndereco}>
                        Salvar endereço da rodada
                      </Button>
                      <Button
                        type="button"
                        variante="secundario"
                        onClick={() => {
                          setEditandoEndereco(false);
                          setErroEndereco(null);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </form>
                )}
              </div>

              {rodada.status === "FINALIZADA" && (
                <>
                  {erroTransicao && (
                    <p className="mensagem-erro" role="alert">
                      {erroTransicao}
                    </p>
                  )}
                  <div className="linha-acoes">
                    <Button onClick={() => navigate(`/grupos/${grupoId}/rodadas/${rodadaIdNum}/wrapped`)}>
                      Abrir votação e Wrapped
                    </Button>
                    {ehAdmin && votacao?.situacao === "ABERTA" && (
                      <Button
                        variante="secundario"
                        carregando={encerrandoVotacao}
                        onClick={aoEncerrarVotacao}
                      >
                        Finalizar votação
                      </Button>
                    )}
                  </div>
                </>
              )}

              {rodada.status !== "FINALIZADA" && rodada.status !== "CANCELADA" && (
                <>
                  {erroTransicao && (
                    <p className="mensagem-erro" role="alert">
                      {erroTransicao}
                    </p>
                  )}
                  {ehAdmin ? (
                    <div className="linha-acoes">
                      {rodada.status === "AGENDADA" && (
                        <Button carregando={iniciando} onClick={aoIniciarRodada}>
                          Iniciar rodada
                        </Button>
                      )}
                      {rodada.status === "EM_ANDAMENTO" && (
                        <Button variante="secundario" carregando={finalizando} onClick={aoFinalizarRodada}>
                          Finalizar rodada
                        </Button>
                      )}
                    </div>
                  ) : (
                    <p className="texto-suave texto-suave--nota">
                      Só um admin da pelada pode iniciar e finalizar a rodada.
                    </p>
                  )}
                  {rodada.status === "AGENDADA" && ehAdmin && (
                    <p className="texto-suave texto-suave--nota">
                      Iniciar a rodada fecha o check-in e gera os pagamentos PIX automaticamente para os
                      confirmados. Ao finalizar, a votação é aberta.
                    </p>
                  )}
                </>
              )}
            </section>

            <section className="painel">
              <h3 className="subtitulo-secao" style={{ marginTop: 0 }}>Check-in</h3>

              {erroCheckin && (
                <p className="mensagem-erro" role="alert" style={{ marginBottom: "12px" }}>
                  {erroCheckin}
                </p>
              )}

              {rodada.status === "AGENDADA" && (
                <div className="linha-acoes linha-acoes--espaco">
                  {!jaConfirmou ? (
                    <Button carregando={fazendoCheckin} onClick={aoConfirmarPresenca}>
                      Confirmar minha presença
                    </Button>
                  ) : (
                    <Button
                      variante="secundario"
                      carregando={cancelandoCheckin}
                      onClick={aoCancelarPresenca}
                    >
                      Cancelar minha presença (desistir)
                    </Button>
                  )}

                  {ehAdmin && checkins.some((c) => c.statusCheckIn !== "CONFIRMADO") && (
                    <Button
                      variante="secundario"
                      carregando={confirmandoTodos}
                      onClick={aoConfirmarTodos}
                    >
                      Confirmar todos
                    </Button>
                  )}
                </div>
              )}

              {carregandoCheckins && <p className="texto-suave">Carregando…</p>}

              {!carregandoCheckins && (
                <ul className="lista-participantes">
                  {checkins.map((c) => (
                    <li key={c.usuarioId} className="item-participante">
                      <span>
                        {c.nome || c.apelido}
                        {c.posicao && (
                          <span className="texto-suave"> · {POSICAO_ROTULO[c.posicao] || c.posicao}</span>
                        )}
                      </span>
                      <span
                        className={`badge-checkin ${
                          c.statusCheckIn === "CONFIRMADO"
                            ? "badge-checkin--confirmado"
                            : c.statusCheckIn === "CANCELADO"
                            ? "badge-status--cancelada"
                            : ""
                        }`}
                      >
                        {c.statusCheckIn === "CONFIRMADO"
                          ? "Confirmado"
                          : c.statusCheckIn === "CANCELADO"
                          ? "Desistiu"
                          : "Pendente"}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Seção de Pagamentos da Rodada */}
            {sistemaPagamentoAtivo && (
              <section className="painel">
                <div className="rodada-cabecalho">
                  <div>
                    <h3 className="subtitulo-secao" style={{ margin: 0 }}>
                      Pagamentos da rodada (PIX)
                    </h3>
                    <p className="texto-suave" style={{ marginTop: "4px" }}>
                      O valor total é dividido igualmente entre os jogadores confirmados. Se alguém
                      desistir, o valor pendente é recalculado.
                    </p>
                  </div>
                  {ehAdmin && jogadoresConfirmados.length > 0 && (
                    <button
                      type="button"
                      className="botao botao--secundario botao--pequeno"
                      disabled={gerandoPagamentos}
                      onClick={aoGerarPagamentos}
                    >
                      {gerandoPagamentos
                        ? "Calculando…"
                        : pagamentos.length === 0
                        ? "Gerar cobranças agora"
                        : "Recalcular cobranças"}
                    </button>
                  )}
                </div>

                {/* Cards de resumo financeiro */}
                <div className="pagamento-resumo-grid">
                  <div className="pagamento-resumo-card">
                    <span className="texto-suave">Valor total da pelada</span>
                    <strong>{formatarMoeda(valorTotalGrupo)}</strong>
                  </div>
                  <div className="pagamento-resumo-card">
                    <span className="texto-suave">
                      Valor por confirmado ({jogadoresConfirmados.length})
                    </span>
                    <strong>{formatarMoeda(valorPorPessoaCalculado)}</strong>
                  </div>
                  <div className="pagamento-resumo-card">
                    <span className="texto-suave">Recebido / Pagos</span>
                    <strong>
                      {formatarMoeda(totalRecebido)} ({pagamentosPagos.length}/
                      {pagamentosAtivos.length})
                    </strong>
                  </div>
                </div>

                {erroPagamento && (
                  <p className="mensagem-erro" role="alert" style={{ marginBottom: "12px" }}>
                    {erroPagamento}
                  </p>
                )}

                {/* Card de destaque do pagamento do próprio usuário logado */}
                {meuPagamento && meuPagamento.status !== "CANCELADO" && (
                  <div className="meu-pagamento-card">
                    <div className="meu-pagamento-topo">
                      <div>
                        <strong>Sua cota nesta rodada: {formatarMoeda(meuPagamento.valor)}</strong>
                        <p className="texto-suave" style={{ margin: "2px 0 0" }}>
                          Status:{" "}
                          <span
                            className={`badge-pagamento badge-pagamento--${meuPagamento.status?.toLowerCase()}`}
                          >
                            {STATUS_PAGAMENTO_ROTULO[meuPagamento.status] || meuPagamento.status}
                          </span>
                        </p>
                      </div>
                      {meuPagamento.status === "PENDENTE" && (
                        <Button
                          type="button"
                          onClick={() => aoAbrirQrCode(meuPagamento.id)}
                          carregando={
                            carregandoQrCode && qrCodePagamentoId === meuPagamento.id
                          }
                        >
                          {qrCodePagamentoId === meuPagamento.id && qrCodeDados
                            ? "Fechar QR Code PIX"
                            : "Pagar com PIX (QR Code)"}
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Modal / Área de exibição do QR Code PIX */}
                {qrCodePagamentoId && (
                  <div className="qrcode-pix-box" role="region" aria-label="QR Code PIX">
                    {carregandoQrCode && <p className="texto-suave">Gerando QR Code PIX…</p>}
                    {erroQrCode && (
                      <p className="mensagem-erro" role="alert">
                        {erroQrCode}
                      </p>
                    )}
                    {qrCodeDados && (
                      <div className="qrcode-pix-conteudo">
                        <img
                          src={qrCodeDados.qrCode}
                          alt="QR Code PIX para pagamento da rodada"
                          className="qrcode-pix-imagem"
                        />
                        <div className="qrcode-pix-detalhes">
                          <h4>{qrCodeDados.mensagem || "Escaneie para pagar via PIX"}</h4>
                          <p className="texto-suave">
                            Valor: <strong>{formatarMoeda(qrCodeDados.valor)}</strong>
                          </p>
                          {(qrCodeDados.chavePix || configPagamento?.chavePixGerente) && (
                            <p className="texto-suave">
                              Chave PIX:{" "}
                              <strong className="codigo-convite">
                                {qrCodeDados.chavePix || configPagamento?.chavePixGerente}
                              </strong>
                            </p>
                          )}
                          <div className="linha-acoes" style={{ marginTop: "8px" }}>
                            {(qrCodeDados.chavePix || configPagamento?.chavePixGerente) && (
                              <BotaoCopiar
                                texto={qrCodeDados.chavePix || configPagamento?.chavePixGerente}
                                rotulo="Copiar chave PIX"
                              />
                            )}
                            {qrCodeDados.copiaECola && (
                              <BotaoCopiar
                                texto={qrCodeDados.copiaECola}
                                rotulo="Copiar PIX Copia e Cola"
                              />
                            )}
                            <button
                              type="button"
                              className="link-simples"
                              onClick={() => {
                                setQrCodePagamentoId(null);
                                setQrCodeDados(null);
                              }}
                            >
                              Fechar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {carregandoPagamentos && <p className="texto-suave">Carregando pagamentos…</p>}

                {!carregandoPagamentos && pagamentos.length === 0 && (
                  <p className="texto-suave">
                    {rodada.status === "AGENDADA"
                      ? ehAdmin
                        ? "As cobranças individuais e os QR Codes PIX serão gerados automaticamente assim que a rodada for iniciada (ou clique em “Gerar cobranças agora”)."
                        : "As cobranças individuais e os QR Codes PIX serão gerados assim que o admin iniciar a rodada."
                      : "Nenhum pagamento gerado para esta rodada ainda."}
                  </p>
                )}

                {!carregandoPagamentos && pagamentos.length > 0 && (
                  <>
                    <div className="linha-acoes linha-acoes--espaco">
                      <button
                        type="button"
                        className={`botao botao--pequeno ${
                          filtroPagamento === "TODOS" ? "botao--primario" : "botao--secundario"
                        }`}
                        onClick={() => setFiltroPagamento("TODOS")}
                      >
                        Todos ({pagamentos.length})
                      </button>
                      <button
                        type="button"
                        className={`botao botao--pequeno ${
                          filtroPagamento === "PENDENTES" ? "botao--primario" : "botao--secundario"
                        }`}
                        onClick={() => setFiltroPagamento("PENDENTES")}
                      >
                        Pendentes ({pagamentosPendentes.length})
                      </button>
                      <button
                        type="button"
                        className={`botao botao--pequeno ${
                          filtroPagamento === "PAGOS" ? "botao--primario" : "botao--secundario"
                        }`}
                        onClick={() => setFiltroPagamento("PAGOS")}
                      >
                        Pagos ({pagamentosPagos.length})
                      </button>
                    </div>

                    <ul className="lista-participantes">
                      {pagamentosFiltrados.map((p) => {
                        const uid = p.usuarioId || p.usuario?.id;
                        const nomeJogador =
                          p.usuarioNome || p.usuario?.nome || p.usuarioApelido || p.usuario?.apelido || "Jogador";
                        return (
                          <li key={p.id} className="item-participante item-pagamento">
                            <div className="item-pagamento-info">
                              <strong>{nomeJogador}</strong>
                              <span className="texto-suave">
                                {" · "}
                                {formatarMoeda(p.valor)}
                              </span>
                              <span
                                className={`badge-pagamento badge-pagamento--${p.status?.toLowerCase()}`}
                              >
                                {STATUS_PAGAMENTO_ROTULO[p.status] || p.status}
                              </span>
                            </div>

                            <div className="linha-acoes">
                              {p.status === "PENDENTE" && (ehAdmin || uid === usuario.id) && (
                                <button
                                  type="button"
                                  className="botao botao--secundario botao--pequeno"
                                  onClick={() => aoAbrirQrCode(p.id)}
                                >
                                  {qrCodePagamentoId === p.id && qrCodeDados
                                    ? "Ocultar QR"
                                    : "QR Code PIX"}
                                </button>
                              )}

                              {ehAdmin && p.status === "PENDENTE" && (
                                <>
                                  <button
                                    type="button"
                                    className="botao botao--primario botao--pequeno"
                                    disabled={marcandoPagoId === p.id}
                                    onClick={() => aoMarcarPago(p.id)}
                                  >
                                    {marcandoPagoId === p.id ? "Salvando…" : "Confirmar pago"}
                                  </button>
                                  {uid && (
                                    <button
                                      type="button"
                                      className="link-simples"
                                      disabled={desistenciaId === uid}
                                      onClick={() => aoRegistrarDesistencia(uid)}
                                    >
                                      {desistenciaId === uid ? "Recalculando…" : "Desistência"}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}
              </section>
            )}

            <section className="painel">
              <h3 className="subtitulo-secao" style={{ marginTop: 0 }}>Sorteio de times</h3>

              {erroSorteio && (
                <p className="mensagem-erro" role="alert">
                  {erroSorteio}
                </p>
              )}

              {ehAdmin && rodada.status !== "FINALIZADA" && rodada.status !== "CANCELADA" && (
                <>
                  <div className="linha-acoes linha-acoes--espaco">
                    <Button
                      variante="secundario"
                      carregando={sorteando === "aleatorio"}
                      disabled={sorteando === "balanceado"}
                      onClick={() => aoSortear("aleatorio")}
                    >
                      Sortear aleatório
                    </Button>
                    <Button
                      carregando={sorteando === "balanceado"}
                      disabled={sorteando === "aleatorio"}
                      onClick={() => aoSortear("balanceado")}
                    >
                      Sortear balanceado
                    </Button>
                  </div>
                  <p className="texto-suave texto-suave--nota">
                    Aleatório embaralha o time, mas garante pelo menos 1 goleiro em cada lado. Balanceado
                    usa a nota média das avaliações de cada jogador pra deixar os times parecidos em força.
                  </p>
                </>
              )}

              {!ehAdmin && rodada.status !== "FINALIZADA" && rodada.status !== "CANCELADA" && (
                <p className="texto-suave texto-suave--nota">
                  Só um admin da pelada pode sortear os times.
                </p>
              )}

              {carregandoTimes && <p className="texto-suave">Carregando…</p>}

              {!carregandoTimes && times.length > 0 && (
                <div className="grid-times">
                  {times.map((time) => (
                    <div key={time.id} className="cartao-time">
                      <h4 className="cartao-time-titulo">{time.nome}</h4>
                      <ul className="lista-jogadores-time">
                        {time.jogadores.map((j) => (
                          <li key={j.usuarioId}>
                            <span>{j.nome || j.apelido}</span>
                            <span className="texto-suave">
                              {POSICAO_ROTULO[j.posicaoPrimaria] || j.posicaoPrimaria}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}

              {!carregandoTimes && times.length === 0 && (
                <p className="texto-suave">Nenhum time sorteado ainda pra essa rodada.</p>
              )}
            </section>

            {(rodada.status === "EM_ANDAMENTO" || rodada.status === "FINALIZADA") && (
              <GolsRodada
                rodadaId={rodadaIdNum}
                status={rodada.status}
                usuarioId={usuario.id}
                ehAdmin={ehAdmin}
                jogadores={jogadoresConfirmados}
                times={times}
              />
            )}

          </>
        )}
      </main>
    </div>
  );
}
