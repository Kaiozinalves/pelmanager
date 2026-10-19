package com.pelmanager.service;

import com.pelmanager.dto.*;
import com.pelmanager.dto.request.VotoRequestDTO;
import com.pelmanager.entity.CheckIn;
import com.pelmanager.entity.Rodada;
import com.pelmanager.entity.Usuario;
import com.pelmanager.entity.VotoRodada;
import com.pelmanager.entity.enums.CategoriaVoto;
import com.pelmanager.entity.enums.StatusCheckIn;
import com.pelmanager.entity.enums.StatusRodada;
import com.pelmanager.exception.AcessoNegadoException;
import com.pelmanager.exception.OperacaoInvalidaException;
import com.pelmanager.exception.RequisicaoInvalidaException;
import com.pelmanager.exception.RodadaNaoEncontradaException;
import com.pelmanager.repository.CheckInRepository;
import com.pelmanager.repository.RodadaRepository;
import com.pelmanager.repository.UsuarioRepository;
import com.pelmanager.repository.VotoRodadaRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VotacaoService {

    public static final String AGUARDANDO_RODADA = "AGUARDANDO_RODADA";
    public static final String ABERTA = "ABERTA";
    public static final String ENCERRADA = "ENCERRADA";

    private final RodadaRepository rodadaRepository;
    private final VotoRodadaRepository votoRepository;
    private final CheckInRepository checkInRepository;
    private final UsuarioRepository usuarioRepository;
    private final PermissaoService permissaoService;

    public VotacaoService(RodadaRepository rodadaRepository,
                          VotoRodadaRepository votoRepository,
                          CheckInRepository checkInRepository,
                          UsuarioRepository usuarioRepository,
                          PermissaoService permissaoService) {
        this.rodadaRepository = rodadaRepository;
        this.votoRepository = votoRepository;
        this.checkInRepository = checkInRepository;
        this.usuarioRepository = usuarioRepository;
        this.permissaoService = permissaoService;
    }

    @Transactional
    public VotoRegistradoDTO votar(Long rodadaId, VotoRequestDTO dto) {
        Rodada rodada = buscarRodada(rodadaId);

        if (rodada.getStatusRodada() != StatusRodada.FINALIZADA) {
            throw new OperacaoInvalidaException("A votação só abre depois que a rodada é finalizada.");
        }
        if (!ABERTA.equals(situacao(rodada))) {
            throw new OperacaoInvalidaException("A votação desta rodada já foi encerrada.");
        }
        if (dto.categoria() == null) {
            throw new RequisicaoInvalidaException("Informe a categoria do voto.");
        }
        if (!rodada.getCategoriasVotacao().contains(dto.categoria())) {
            throw new OperacaoInvalidaException("Esta categoria não está ativa para esta rodada.");
        }
        if (dto.votanteId() == null || dto.votadoId() == null) {
            throw new RequisicaoInvalidaException("Informe quem está votando e em quem.");
        }
        if (dto.votanteId().equals(dto.votadoId())) {
            throw new RequisicaoInvalidaException("Você não pode votar em si mesmo.");
        }

        Usuario votante = permissaoService.buscarUsuario(dto.votanteId());
        if (!permissaoService.temCheckInConfirmado(rodadaId, votante.getId())) {
            throw new AcessoNegadoException("Apenas quem confirmou presença nesta rodada pode votar.");
        }
        if (!permissaoService.temCheckInConfirmado(rodadaId, dto.votadoId())) {
            throw new RequisicaoInvalidaException("Você só pode votar em quem confirmou presença nesta rodada.");
        }
        Usuario votado = permissaoService.buscarUsuario(dto.votadoId());

        if (votoRepository.existsByRodadaIdAndCategoriaAndVotanteId(rodadaId, dto.categoria(), votante.getId())) {
            throw new OperacaoInvalidaException("Você já votou nesta categoria.");
        }

        VotoRodada voto = new VotoRodada();
        voto.setRodada(rodada);
        voto.setCategoria(dto.categoria());
        voto.setVotante(votante);
        voto.setVotado(votado);
        voto.setDataVoto(LocalDateTime.now());

        try {
            // saveAndFlush: se duas requisições passarem juntas pela checagem acima,
            // a constraint única do banco barra a segunda.
            votoRepository.saveAndFlush(voto);
        } catch (DataIntegrityViolationException e) {
            throw new OperacaoInvalidaException("Você já votou nesta categoria.");
        }

        return new VotoRegistradoDTO(rodadaId, dto.categoria().name(), voto.getDataVoto());
    }

    @Transactional(readOnly = true)
    public VotacaoResponseDTO consultar(Long rodadaId, Long usuarioId) {
        Rodada rodada = buscarRodada(rodadaId);
        permissaoService.exigirParticipante(usuarioId, rodada.getGrupo());

        String situacao = situacao(rodada);
        if (rodada.getStatusRodada() != StatusRodada.FINALIZADA) {
            return new VotacaoResponseDTO(rodadaId, situacao, null, false, 0, List.of(), List.of());
        }

        List<CheckIn> confirmados = checkInRepository.findByRodadaIdAndStatus(rodadaId, StatusCheckIn.CONFIRMADO);
        int totalEleitores = confirmados.size();
        boolean elegivel = confirmados.stream().anyMatch(c -> c.getUsuario().getId().equals(usuarioId));
        boolean encerrada = ENCERRADA.equals(situacao);

        // Candidatos: quem confirmou presença, exceto o próprio usuário.
        List<JogadorResumoDTO> candidatos = elegivel
                ? confirmados.stream()
                    .map(CheckIn::getUsuario)
                    .filter(u -> !u.getId().equals(usuarioId))
                    .map(this::resumo)
                    .sorted(Comparator.comparing(JogadorResumoDTO::nome, String.CASE_INSENSITIVE_ORDER))
                    .toList()
                : List.of();

        Map<CategoriaVoto, Map<Long, Long>> apuracao = apurar(rodadaId);
        Map<Long, Usuario> usuariosVotados = carregarUsuarios(apuracao);
        Set<CategoriaVoto> jaVotei = votoRepository.findByRodadaIdAndVotanteId(rodadaId, usuarioId).stream()
                .map(VotoRodada::getCategoria)
                .collect(Collectors.toSet());

        List<CategoriaVotacaoDTO> categorias = new ArrayList<>();
        for (CategoriaVoto categoria : CategoriaVoto.values()) {
            if (!rodada.getCategoriasVotacao().contains(categoria)) {
                continue;
            }
            Map<Long, Long> contagem = apuracao.getOrDefault(categoria, Map.of());
            int votosRecebidos = (int) contagem.values().stream().mapToLong(Long::longValue).sum();

            // Resultado só aparece quando não dá mais para votar (prazo/encerramento manual)
            // ou quando todos os eleitores já votaram nesta categoria.
            boolean resultadoLiberado = encerrada || (totalEleitores > 0 && votosRecebidos >= totalEleitores);
            ResultadoCategoriaDTO resultado = resultadoLiberado
                    ? montarResultado(contagem, usuariosVotados, votosRecebidos)
                    : null;

            categorias.add(new CategoriaVotacaoDTO(
                    categoria.name(),
                    categoria.getRotulo(),
                    jaVotei.contains(categoria),
                    votosRecebidos,
                    totalEleitores,
                    resultado
            ));
        }

        return new VotacaoResponseDTO(rodadaId, situacao, rodada.getVotacaoAte(), elegivel, totalEleitores, categorias, candidatos);
    }

    /** AGUARDANDO_RODADA | ABERTA | ENCERRADA — usado também por RodadaService. */
    public static String situacao(Rodada rodada) {
        if (rodada.getStatusRodada() != StatusRodada.FINALIZADA) {
            return AGUARDANDO_RODADA;
        }
        LocalDateTime prazo = rodada.getVotacaoAte();
        if (prazo == null || LocalDateTime.now().isAfter(prazo)) {
            return ENCERRADA;
        }
        return ABERTA;
    }


    private ResultadoCategoriaDTO montarResultado(Map<Long, Long> contagem,
                                                  Map<Long, Usuario> usuarios,
                                                  int totalVotos) {
        List<ApuracaoDTO> ranking = contagem.entrySet().stream()
                .map(e -> {
                    Usuario u = usuarios.get(e.getKey());
                    return new ApuracaoDTO(u.getId(), u.getNome(), u.getApelido(), e.getValue().intValue());
                })
                .sorted(Comparator.comparingInt(ApuracaoDTO::votos).reversed()
                        .thenComparing(ApuracaoDTO::nome, String.CASE_INSENSITIVE_ORDER))
                .toList();

        int maximo = ranking.isEmpty() ? 0 : ranking.get(0).votos();
        List<ApuracaoDTO> vencedores = ranking.stream()
                .filter(a -> a.votos() == maximo)
                .toList();

        return new ResultadoCategoriaDTO(totalVotos, vencedores.size() > 1, vencedores, ranking);
    }

    private Map<CategoriaVoto, Map<Long, Long>> apurar(Long rodadaId) {
        Map<CategoriaVoto, Map<Long, Long>> resultado = new EnumMap<>(CategoriaVoto.class);
        for (Object[] linha : votoRepository.apurarVotos(rodadaId)) {
            CategoriaVoto categoria = (CategoriaVoto) linha[0];
            Long votadoId = (Long) linha[1];
            Long quantidade = (Long) linha[2];
            resultado.computeIfAbsent(categoria, c -> new HashMap<>()).put(votadoId, quantidade);
        }
        return resultado;
    }

    private Map<Long, Usuario> carregarUsuarios(Map<CategoriaVoto, Map<Long, Long>> apuracao) {
        Set<Long> ids = apuracao.values().stream()
                .flatMap(m -> m.keySet().stream())
                .collect(Collectors.toSet());
        return usuarioRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Usuario::getId, u -> u));
    }

    private JogadorResumoDTO resumo(Usuario usuario) {
        return new JogadorResumoDTO(usuario.getId(), usuario.getNome(), usuario.getApelido());
    }

    private Rodada buscarRodada(Long rodadaId) {
        return rodadaRepository.findById(rodadaId)
                .orElseThrow(() -> new RodadaNaoEncontradaException(rodadaId));
    }
}
