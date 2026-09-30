package com.pelmanager.sorteio;

import com.pelmanager.entity.enums.Posicao;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Random;

public final class BalanceadorDeTimes {

    // ===================== TIPOS DE ENTRADA E SAÍDA =====================

    // Um jogador como o algoritmo enxerga: só id, nota e posições.
    public record Jogador(Long id, double nota, Posicao primaria, Posicao secundaria) {}

    // Um jogador já colocado numa posição do time, com o "custo" dessa escolha.
    public record Escalacao(Jogador jogador, Posicao posicaoEscalada, int custoPosicao) {
        public boolean foraDePosicao() { return custoPosicao > 0; }
    }

    // Um time pronto: lista de escalações, nota média e custo de posição do time.
    public record TimeMontado(List<Escalacao> escalacoes, double notaMedia, int custoPosicao) {}

    // Resultado final do sorteio.
    public record Resultado(List<TimeMontado> times, double custoTotal, double desvioNotas) {}

    // ===================== PARÂMETROS AJUSTÁVEIS =====================

    static final double PESO_POSICAO = 1.0;
    static final double PESO_NOTA = 60.0;

    static final int CUSTO_SECUNDARIA = 1;
    static final int CUSTO_BASE_FORA = 2;
    static final int CUSTO_GOLEIRO_FALTANDO = 10;
    static final int CUSTO_GOLEIRO_NA_LINHA = 6;
    static final int CUSTO_SEM_POSICAO = 3;

    static final int TENTATIVAS = 60;
    static final double TOLERANCIA_SORTEIO = 0.5;

    private static final Posicao[] CICLO_LINHA = {
            Posicao.ZAGUEIRO, Posicao.MEIO_CAMPO, Posicao.ATACANTE, Posicao.LATERAL,
            Posicao.MEIO_CAMPO, Posicao.ATACANTE, Posicao.ZAGUEIRO, Posicao.LATERAL,
            Posicao.MEIO_CAMPO, Posicao.ATACANTE
    };

    private final Random random;

    public BalanceadorDeTimes(Random random) { this.random = random; }
    public BalanceadorDeTimes() { this(new Random()); }

    // ===================== REGRAS DE POSIÇÃO =====================

    public static Posicao[] formacao(int k) {
        Posicao[] slots = new Posicao[k];
        slots[0] = Posicao.GOLEIRO;
        for (int i = 1; i < k; i++) slots[i] = CICLO_LINHA[(i - 1) % CICLO_LINHA.length];
        return slots;
    }

    private static int regua(Posicao p) {
        return switch (p) {
            case ZAGUEIRO -> 0;
            case LATERAL -> 1;
            case MEIO_CAMPO -> 2;
            case ATACANTE -> 3;
            default -> throw new IllegalArgumentException("Não é posição de linha: " + p);
        };
    }

    public static int custo(Jogador j, Posicao slot) {
        Posicao pri = j.primaria();
        Posicao sec = j.secundaria();

        if (slot == pri) return 0;
        if (slot == sec) return CUSTO_SECUNDARIA;
        if (slot == Posicao.GOLEIRO) return CUSTO_GOLEIRO_FALTANDO;
        if (pri == null && sec == null) return CUSTO_SEM_POSICAO;

        int menorDistancia = Integer.MAX_VALUE;
        for (Posicao conhecida : new Posicao[]{pri, sec}) {
            if (conhecida != null && conhecida != Posicao.GOLEIRO) {
                menorDistancia = Math.min(menorDistancia, Math.abs(regua(conhecida) - regua(slot)));
            }
        }
        if (menorDistancia == Integer.MAX_VALUE) return CUSTO_GOLEIRO_NA_LINHA;
        return CUSTO_BASE_FORA + menorDistancia;
    }

    // ===================== MÉTODO PRINCIPAL =====================

    public Resultado sortear(List<Jogador> jogadores, int jogadoresPorTime) {
        int n = jogadores.size();
        if (jogadoresPorTime < 2 || jogadoresPorTime > 11)
            throw new IllegalArgumentException("jogadoresPorTime deve estar entre 2 e 11.");
        if (n < 2)
            throw new IllegalArgumentException("São necessários ao menos 2 jogadores para sortear.");

        int numTimes = Math.max(2, n / jogadoresPorTime);

        int[] tamanhos = new int[numTimes];
        for (int t = 0; t < numTimes; t++) tamanhos[t] = n / numTimes + (t < n % numTimes ? 1 : 0);

        Contexto ctx = new Contexto(jogadores, tamanhos);

        List<Solucao> solucoes = new ArrayList<>();
        for (int i = 0; i < TENTATIVAS; i++) solucoes.add(buscaLocal(ctx));

        double melhor = solucoes.stream().mapToDouble(s -> s.custo).min().orElseThrow();
        List<Solucao> empatadas = solucoes.stream().filter(s -> s.custo <= melhor + TOLERANCIA_SORTEIO).toList();

        Solucao escolhida = empatadas.get(random.nextInt(empatadas.size()));

        return ctx.montarResultado(escolhida);
    }

    // ===================== DADOS PRÉ-CALCULADOS =====================

    private static final class Contexto {
        final List<Jogador> jogadores;
        final int n;
        final int[] tamanhos;
        final Posicao[][] slotsDoTime;
        final int[][] custo;
        final double[] notaNorm;

        Contexto(List<Jogador> jogadores, int[] tamanhos) {
            this.jogadores = jogadores;
            this.n = jogadores.size();
            this.tamanhos = tamanhos;

            this.slotsDoTime = new Posicao[tamanhos.length][];
            for (int t = 0; t < tamanhos.length; t++) slotsDoTime[t] = formacao(tamanhos[t]);

            this.custo = new int[n][Posicao.values().length];
            for (int i = 0; i < n; i++)
                for (Posicao p : Posicao.values()) custo[i][p.ordinal()] = custo(jogadores.get(i), p);

            double media = jogadores.stream().mapToDouble(Jogador::nota).average().orElse(1.0);
            if (media <= 0) media = 1.0;
            this.notaNorm = new double[n];
            for (int i = 0; i < n; i++) notaNorm[i] = jogadores.get(i).nota() / media;
        }

        int custoPosicao(int[] membros, int t, int[] atribuicaoOut) {
            Posicao[] slots = slotsDoTime[t];
            int k = membros.length;
            int full = (1 << k) - 1;
            int[] dp = new int[1 << k];
            int[] pai = new int[1 << k];
            Arrays.fill(dp, Integer.MAX_VALUE);
            dp[0] = 0;
            for (int mask = 0; mask < full; mask++) {
                if (dp[mask] == Integer.MAX_VALUE) continue;
                int s = Integer.bitCount(mask);
                for (int p = 0; p < k; p++) {
                    if ((mask & (1 << p)) != 0) continue;
                    int novo = dp[mask] + custo[membros[p]][slots[s].ordinal()];
                    int nm = mask | (1 << p);
                    if (novo < dp[nm]) { dp[nm] = novo; pai[nm] = p; }
                }
            }
            if (atribuicaoOut != null) {
                int mask = full;
                for (int s = k - 1; s >= 0; s--) {
                    int p = pai[mask];
                    atribuicaoOut[s] = p;
                    mask &= ~(1 << p);
                }
            }
            return dp[full];
        }

        double mediaNota(int[] membros) {
            double soma = 0;
            for (int m : membros) soma += notaNorm[m];
            return soma / membros.length;
        }

        static double desvioPadrao(double[] v) {
            double m = 0;
            for (double x : v) m += x;
            m /= v.length;
            double s = 0;
            for (double x : v) s += (x - m) * (x - m);
            return Math.sqrt(s / v.length);
        }

        double custoTotal(int[] custosPos, double[] medias) {
            int soma = 0;
            for (int c : custosPos) soma += c;
            return PESO_POSICAO * soma + PESO_NOTA * desvioPadrao(medias);
        }

        Resultado montarResultado(Solucao s) {
            List<TimeMontado> times = new ArrayList<>();
            for (int t = 0; t < s.membros.length; t++) {
                int k = s.membros[t].length;
                int[] atrib = new int[k];
                int custoPos = custoPosicao(s.membros[t], t, atrib);
                List<Escalacao> esc = new ArrayList<>();
                for (int slot = 0; slot < k; slot++) {
                    int idx = s.membros[t][atrib[slot]];
                    Posicao pos = slotsDoTime[t][slot];
                    esc.add(new Escalacao(jogadores.get(idx), pos, custo[idx][pos.ordinal()]));
                }
                double media = 0;
                for (Escalacao e : esc) media += e.jogador().nota();
                times.add(new TimeMontado(esc, media / k, custoPos));
            }
            return new Resultado(times, s.custo, desvioPadrao(s.medias));
        }
    }

    private static final class Solucao {
        int[][] membros;
        int[] custosPos;
        double[] medias;
        double custo;
    }

    private Solucao buscaLocal(Contexto ctx) {
        int T = ctx.tamanhos.length;

        List<Integer> ordem = new ArrayList<>();
        for (int i = 0; i < ctx.n; i++) ordem.add(i);
        Collections.shuffle(ordem, random);

        Solucao s = new Solucao();
        s.membros = new int[T][];
        s.custosPos = new int[T];
        s.medias = new double[T];
        int cursor = 0;
        for (int t = 0; t < T; t++) {
            s.membros[t] = new int[ctx.tamanhos[t]];
            for (int j = 0; j < ctx.tamanhos[t]; j++) s.membros[t][j] = ordem.get(cursor++);
            s.custosPos[t] = ctx.custoPosicao(s.membros[t], t, null);
            s.medias[t] = ctx.mediaNota(s.membros[t]);
        }
        s.custo = ctx.custoTotal(s.custosPos, s.medias);

        boolean melhorou = true;
        while (melhorou) {
            melhorou = false;
            for (int t1 = 0; t1 < T; t1++) {
                for (int t2 = t1 + 1; t2 < T; t2++) {
                    for (int a = 0; a < s.membros[t1].length; a++) {
                        for (int b = 0; b < s.membros[t2].length; b++) {
                            trocar(s, t1, a, t2, b);

                            int c1 = ctx.custoPosicao(s.membros[t1], t1, null);
                            int c2 = ctx.custoPosicao(s.membros[t2], t2, null);
                            double m1 = ctx.mediaNota(s.membros[t1]);
                            double m2 = ctx.mediaNota(s.membros[t2]);

                            int antigoC1 = s.custosPos[t1], antigoC2 = s.custosPos[t2];
                            double antigoM1 = s.medias[t1], antigoM2 = s.medias[t2];
                            s.custosPos[t1] = c1; s.custosPos[t2] = c2;
                            s.medias[t1] = m1; s.medias[t2] = m2;
                            double novo = ctx.custoTotal(s.custosPos, s.medias);

                            if (novo < s.custo - 1e-9) {
                                s.custo = novo;
                                melhorou = true;
                            } else {
                                trocar(s, t1, a, t2, b);
                                s.custosPos[t1] = antigoC1; s.custosPos[t2] = antigoC2;
                                s.medias[t1] = antigoM1; s.medias[t2] = antigoM2;
                            }
                        }
                    }
                }
            }
        }
        return s;
    }

    private static void trocar(Solucao s, int t1, int a, int t2, int b) {
        int tmp = s.membros[t1][a];
        s.membros[t1][a] = s.membros[t2][b];
        s.membros[t2][b] = tmp;
    }
}
