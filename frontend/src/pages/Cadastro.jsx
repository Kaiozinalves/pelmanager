import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Input, Select } from "../components/Input";
import { Button } from "../components/Button";
import { POSICOES, PERNAS } from "../constants/enums";

const FORM_INICIAL = {
  nome: "",
  apelido: "",
  email: "",
  senha: "",
  confirmarSenha: "",
  peDominante: "",
  posicaoPrimaria: "",
  posicaoSecundaria: "",
};

export function Cadastro() {
  const { cadastrar, carregando, erro, limparErro } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState(FORM_INICIAL);
  const [erroSenha, setErroSenha] = useState(null);

  function atualizarCampo(campo, valor) {
    limparErro();
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    setErroSenha(null);

    if (form.senha !== form.confirmarSenha) {
      setErroSenha("As senhas não coincidem.");
      return;
    }

    const { confirmarSenha, ...dadosParaEnviar } = form;
    dadosParaEnviar.posicaoSecundaria = dadosParaEnviar.posicaoSecundaria || null;

    const sucesso = await cadastrar(dadosParaEnviar);
    if (sucesso) {
      navegar("/home");
    }
  }

  return (
    <AuthLayout titulo="Criar conta" subtitulo="Leva menos de um minuto.">
      <form className="formulario" onSubmit={aoSubmeter} noValidate>
        <div className="formulario-linha">
          <Input
            id="nome"
            label="Nome completo"
            required
            value={form.nome}
            onChange={(e) => atualizarCampo("nome", e.target.value)}
          />
          <Input
            id="apelido"
            label="Apelido"
            placeholder="Como te chamam na quadra"
            value={form.apelido}
            onChange={(e) => atualizarCampo("apelido", e.target.value)}
          />
        </div>

        <Input
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => atualizarCampo("email", e.target.value)}
        />

        <div className="formulario-linha">
          <Input
            id="senha"
            label="Senha"
            type="password"
            autoComplete="new-password"
            required
            value={form.senha}
            onChange={(e) => atualizarCampo("senha", e.target.value)}
          />
          <Input
            id="confirmarSenha"
            label="Confirmar senha"
            type="password"
            autoComplete="new-password"
            required
            value={form.confirmarSenha}
            onChange={(e) => atualizarCampo("confirmarSenha", e.target.value)}
            error={erroSenha}
          />
        </div>

        <div className="formulario-linha">
          <Select
            id="posicaoPrimaria"
            label="Posição principal"
            required
            value={form.posicaoPrimaria}
            onChange={(e) => atualizarCampo("posicaoPrimaria", e.target.value)}
          >
            <option value="" disabled>
              Selecione
            </option>
            {POSICOES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </Select>

          <Select
            id="posicaoSecundaria"
            label="Posição secundária (opcional)"
            value={form.posicaoSecundaria}
            onChange={(e) => atualizarCampo("posicaoSecundaria", e.target.value)}
          >
            <option value="">Nenhuma</option>
            {POSICOES.map((p) => (
              <option key={p.valor} value={p.valor}>
                {p.rotulo}
              </option>
            ))}
          </Select>
        </div>

        <Select
          id="peDominante"
          label="Perna dominante"
          required
          value={form.peDominante}
          onChange={(e) => atualizarCampo("peDominante", e.target.value)}
        >
          <option value="" disabled>
            Selecione
          </option>
          {PERNAS.map((p) => (
            <option key={p.valor} value={p.valor}>
              {p.rotulo}
            </option>
          ))}
        </Select>

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <Button type="submit" carregando={carregando}>
          Criar conta
        </Button>

        <p className="auth-rodape">
          Já tem conta? <Link to="/login">Entrar</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
