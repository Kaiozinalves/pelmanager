import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AuthLayout } from "../components/AuthLayout";
import { Input } from "../components/Input";
import { Button } from "../components/Button";

export function Login() {
  const { entrar, carregando, erro, limparErro } = useAuth();
  const navegar = useNavigate();
  const [form, setForm] = useState({ email: "", senha: "" });

  function atualizarCampo(campo, valor) {
    limparErro();
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function aoSubmeter(evento) {
    evento.preventDefault();
    const sucesso = await entrar(form);
    if (sucesso) {
      navegar("/home");
    }
  }

  return (
    <AuthLayout titulo="Entrar" subtitulo="Bora pra pelada.">
      <form className="formulario" onSubmit={aoSubmeter} noValidate>
        <Input
          id="email"
          label="E-mail"
          type="email"
          autoComplete="email"
          required
          value={form.email}
          onChange={(e) => atualizarCampo("email", e.target.value)}
        />
        <Input
          id="senha"
          label="Senha"
          type="password"
          autoComplete="current-password"
          required
          value={form.senha}
          onChange={(e) => atualizarCampo("senha", e.target.value)}
        />

        {erro && (
          <p className="mensagem-erro" role="alert">
            {erro}
          </p>
        )}

        <Button type="submit" carregando={carregando}>
          Entrar
        </Button>

        <p className="auth-rodape">
          Ainda não joga com a gente?{" "}
          <Link to="/cadastro">Crie sua conta</Link>
        </p>
      </form>
    </AuthLayout>
  );
}
