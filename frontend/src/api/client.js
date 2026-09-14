import axios from "axios";

// Ajuste a URL base no arquivo .env (VITE_API_URL) ou aqui, direto.
// Por padrão aponta pro Spring Boot rodando localmente.
const baseURL = import.meta.env.VITE_API_URL || "http://localhost:8080/api";

export const api = axios.create({
  baseURL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("pelada_token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// O backend ainda não tem autenticação (sem Spring Security / JWT até
// agora), então não existe token pra anexar nas requisições. Quando você
// implementar login de verdade, descomenta o interceptor abaixo:
//
// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("pelada_token");
//   if (token) config.headers.Authorization = `Bearer ${token}`;
//   return config;
// });
