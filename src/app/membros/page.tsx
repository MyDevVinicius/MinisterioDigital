"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import MembrosList from "@/components/MembrosList/MembrosList";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const MembrosPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Carregando status
  const [clienteAtivo, setClienteAtivo] = useState<boolean | null>(null); // Estado para status do cliente

  useEffect(() => {
    const fetchClienteStatus = async () => {
      try {
        const codigoVerificacao = localStorage.getItem("codigo_verificacao"); // Recupere o código de verificação do localStorage ou do cookie
        if (!codigoVerificacao) {
          console.log(
            "Código de verificação não encontrado, redirecionando para login",
          );
          router.push("/login");
          return;
        }

        console.log(
          "Código de verificação encontrado no localStorage:",
          codigoVerificacao,
        );
        // Chame sua API para verificar o status do cliente
        const response = await fetch(
          `/api/protectStatus?codigoVerificacao=${codigoVerificacao}`,
        );
        const data = await response.json();

        console.log("Resposta da API protectStatus:", data);

        if (response.status !== 200 || data.status !== "ativo") {
          console.log(
            "Cliente inativo ou erro na resposta, redirecionando para login",
          );
          router.push("/login");
          return;
        }

        console.log("Cliente ativo, configurando estado");
        setClienteAtivo(true);
      } catch (error) {
        console.error("Erro ao buscar o status do cliente:", error);
        router.push("/login"); // Em caso de erro, redireciona para login
      } finally {
        setLoading(false);
      }
    };

    fetchClienteStatus();
  }, [router]);

  if (loading) {
    console.log("Carregando...");
    return <div>Carregando...</div>; // Mostra a tela de carregamento enquanto verifica o status
  }

  if (clienteAtivo === null) {
    console.log("Status do cliente ainda não definido.");
    return <div>Verificando status do cliente...</div>;
  }

  if (clienteAtivo === false) {
    console.log("Cliente inativo, não renderizando nada");
    return null; // Não renderiza nada se o cliente estiver inativo
  }

  console.log("Renderizando página de membros para cliente ativo");
  return (
    <div className="space-y-5 p-4">
      <DefaultLayout>
        <MembrosList /> {/* Componente MembrosList renderizado */}
      </DefaultLayout>
      <ToastContainer position="top-right" />
    </div>
  );
};

export default MembrosPage;
