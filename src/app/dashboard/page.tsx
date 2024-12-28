"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DefaultLayout from "@/components/Layouts/DefaultLayout";
import ECommerce from "@/components/Dashboard/E-commerce";

const DashboardPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true); // Carregando status
  const [clienteAtivo, setClienteAtivo] = useState<boolean | null>(null); // Status do cliente
  const [acessoPermitido, setAcessoPermitido] = useState(true); // Flag para verificar se o usuário tem permissão

  useEffect(() => {
    const fetchClienteStatus = async () => {
      try {
        const codigoVerificacao = localStorage.getItem("codigo_verificacao");
        const email = localStorage.getItem("email");
        const nomeBanco = localStorage.getItem("nome_banco");

        // Verifica se as informações estão disponíveis no localStorage
        if (!codigoVerificacao || !email || !nomeBanco) {
          console.log(
            "Dados do cliente não encontrados, redirecionando para login.",
          );
          router.push("/login");
          return;
        }

        // Chama a API para verificar o status do cliente
        const response = await fetch(
          `/api/protectStatus?codigoVerificacao=${codigoVerificacao}`,
        );
        const data = await response.json();

        // Verifica se o status do cliente é ativo
        if (response.status !== 200 || data.status !== "ativo") {
          console.log("Cliente inativo, redirecionando para login.");
          router.push("/login");
          return;
        }

        setClienteAtivo(true);

        // Chama a API para verificar as permissões
        const permissionsResponse = await fetch(
          `/api/checkPermissions?codigoVerificacao=${codigoVerificacao}&email=${email}&nomeBanco=${nomeBanco}`,
        );
        const permissionsData = await permissionsResponse.json();

        // Verifica se a resposta da API de permissões é válida
        if (permissionsResponse.status !== 200) {
          console.log("Erro ao buscar permissões", permissionsData);
          setAcessoPermitido(false);
          return;
        }

        // Verifica se o usuário tem permissão para acessar o Dashboard
        const hasPermission = permissionsData.permissoes.some(
          (perm: any) => perm.nome_pagina === "Dashboard" && perm.ativado,
        );

        if (!hasPermission) {
          setAcessoPermitido(false);
        }
      } catch (error) {
        console.error("Erro ao buscar status ou permissões", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchClienteStatus();
  }, [router]);

  // Exibe indicador de carregamento enquanto os dados estão sendo carregados
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Exibe mensagem enquanto o status do cliente está sendo verificado
  if (clienteAtivo === null) {
    return <div>Verificando status do cliente...</div>;
  }

  // Exibe mensagem de erro se o cliente estiver inativo ou sem permissão
  if (clienteAtivo === false || !acessoPermitido) {
    return <div>Você não tem permissão para acessar esta página.</div>;
  }

  // Exibe o conteúdo do Dashboard se tudo estiver correto
  return (
    <div className="space-y-5 bg-white p-4">
      <DefaultLayout>
        <ECommerce />
      </DefaultLayout>
    </div>
  );
};

export default DashboardPage;
