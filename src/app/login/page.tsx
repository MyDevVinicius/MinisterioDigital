"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const LoginPage = () => {
  const [codigoVerificacao, setCodigoVerificacao] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [isCodigoVerificacaoValidado, setIsCodigoVerificacaoValidado] =
    useState(false);
  const [nomeIgreja, setNomeIgreja] = useState<string | null>(null);
  const [isClienteAtivo, setIsClienteAtivo] = useState(true);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const nome_banco = localStorage.getItem("nome_banco");
    const nome_igreja = localStorage.getItem("nome_igreja");
    const clienteAtivo = localStorage.getItem("cliente_ativo") === "true";
    const codigo_verificacao = localStorage.getItem("codigo_verificacao");

    if (codigo_verificacao) {
      setCodigoVerificacao(codigo_verificacao);
      setIsCodigoVerificacaoValidado(true);
    }

    if (!clienteAtivo) {
      setIsClienteAtivo(false);
      return;
    }

    if (nome_banco && nome_igreja && clienteAtivo) {
      setIsCodigoVerificacaoValidado(true);
      setNomeIgreja(nome_igreja || "Igreja não definida");
    } else {
      console.log("Erro: As chaves não foram encontradas no localStorage.");
    }
  }, []);

  const handleCodigoVerificacaoSubmit = async () => {
    setErro("");
    setLoading(true);

    if (!codigoVerificacao) {
      setErro("O código de verificação é necessário.");
      toast.error("O código de verificação é necessário.");
      setLoading(false);
      return;
    }

    try {
      console.log("Enviando código de verificação...");
      const response = await fetch("/api/clientes", {
        method: "POST",
        body: JSON.stringify({ codigo_verificacao: codigoVerificacao }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log("Resposta da API /api/clientes:", data);

      if (data.error) {
        setErro(data.error);
        toast.error(data.error);
        setLoading(false);
        return;
      }

      if (!data.cliente.status || data.cliente.status !== "ativo") {
        setIsClienteAtivo(false);
        localStorage.setItem("cliente_ativo", "false");
        toast.error("O cliente está inativo. Acesso bloqueado.");
        setLoading(false);
        return;
      }

      console.log("Salvando informações no localStorage...");
      localStorage.setItem("nome_banco", data.cliente.nome_banco);
      localStorage.setItem("nome_igreja", data.cliente.nome_igreja);
      localStorage.setItem("cliente_ativo", "true");
      localStorage.setItem("codigo_verificacao", codigoVerificacao);

      setNomeIgreja(data.cliente.nome_igreja);
      setIsClienteAtivo(true);
      setIsCodigoVerificacaoValidado(true);
      toast.success(
        `Código validado com sucesso! Licenciado para ${data.cliente.nome_igreja}`,
      );
      setLoading(false);
    } catch (error) {
      console.error("Erro ao validar o código de verificação:", error);
      setErro("Erro ao validar o código de verificação.");
      toast.error("Erro ao validar o código de verificação.");
      setLoading(false);
    }
  };

  const handleLoginSubmit = async () => {
    setErro("");
    setLoading(true);

    if (!email || !senha) {
      setErro("Por favor, insira o e-mail e a senha.");
      toast.error("Por favor, insira o e-mail e a senha.");
      setLoading(false);
      return;
    }

    const nome_banco = localStorage.getItem("nome_banco");
    const codigo_verificacao = localStorage.getItem("codigo_verificacao");
    const clienteAtivo = localStorage.getItem("cliente_ativo") === "true";

    if (!clienteAtivo) {
      setErro("O cliente está inativo. Acesso bloqueado.");
      toast.error("O cliente está inativo. Acesso bloqueado.");
      setLoading(false);
      return;
    }

    if (!nome_banco || !codigo_verificacao) {
      setErro("Banco de dados do cliente não encontrado.");
      toast.error("Banco de dados do cliente não encontrado.");
      setLoading(false);
      return;
    }

    try {
      console.log("Enviando dados de login...");
      const response = await fetch("/api/auth", {
        method: "POST",
        body: JSON.stringify({
          email,
          senha,
          nome_banco, // Aqui o nome do banco vem do localStorage
          codigo_verificacao,
        }),
        headers: { "Content-Type": "application/json" },
      });

      const data = await response.json();
      console.log("Resposta da API /api/auth:", data);

      if (data.error) {
        setErro(data.error);
        toast.error(data.error);
        setLoading(false);
        return;
      }

      // Verifica se o cliente ainda está ativo após o login
      if (data.clienteStatus !== "ativo") {
        // Mantém o estado de cliente ativo no localStorage como true se estiver correto
        if (localStorage.getItem("cliente_ativo") !== "false") {
          localStorage.setItem("cliente_ativo", "true");
        }

        toast.success("Login realizado com sucesso!");
        localStorage.setItem("email", email);
        router.push("/dashboard");
      } else {
        setIsClienteAtivo(false);
        localStorage.setItem("cliente_ativo", "false");
        toast.error("O cliente está inativo. Acesso bloqueado.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Erro ao autenticar o usuário:", error);
      setErro("Erro ao autenticar o usuário.");
      toast.error("Erro ao autenticar o usuário.");
      setLoading(false);
    }
  };

  if (!isClienteAtivo) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-sm rounded-md border bg-white p-6 shadow-lg">
          <ToastContainer position="top-right" autoClose={5000} />
          <div className="mb-4 flex justify-center">
            <Image src="/logosoft.png" alt="Logo" width={320} height={100} />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-bold text-media">
              Adicione o código de Verificação
            </label>
            <input
              type="text"
              value={codigoVerificacao}
              onChange={(e) => setCodigoVerificacao(e.target.value)}
              className="mb-4 w-full rounded border border-media p-2"
              disabled={loading}
            />
            <button
              onClick={handleCodigoVerificacaoSubmit}
              className={`w-full rounded bg-media py-2 font-bold text-white ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Validando..." : "Validar Código"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-sm rounded-md border bg-white p-6 shadow-lg">
        <ToastContainer position="top-right" autoClose={5000} />
        <div className="mb-4 flex justify-center">
          <Image src="/logosoft.png" alt="Logo" width={320} height={100} />
        </div>

        {!isCodigoVerificacaoValidado ? (
          <div>
            <label className="mb-2 block text-sm font-bold text-media">
              Adicione o código de Verificação
            </label>
            <input
              type="text"
              value={codigoVerificacao}
              onChange={(e) => setCodigoVerificacao(e.target.value)}
              className="mb-4 w-full rounded border border-media p-2"
              disabled={loading}
            />
            <button
              onClick={handleCodigoVerificacaoSubmit}
              className={`w-full rounded bg-media py-2 font-bold text-white ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Validando..." : "Validar Código"}
            </button>
          </div>
        ) : (
          <div>
            <label className="mb-2 block text-sm font-bold text-media">
              E-mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mb-4 w-full rounded border border-media p-2"
            />
            <label className="mb-2 block text-sm font-bold text-media">
              Senha
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="mb-4 w-full rounded border border-media p-2"
            />
            <button
              onClick={handleLoginSubmit}
              className={`w-full rounded bg-media py-2 font-bold text-white ${
                loading ? "cursor-not-allowed opacity-50" : ""
              }`}
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
