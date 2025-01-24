"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Importa o useRouter para redirecionamento
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { FaLock } from "react-icons/fa"; // Importa o ícone de cadeado

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [acessoPermitido, setAcessoPermitido] = useState(true); // Flag para verificar se o usuário tem permissão
  const [loading, setLoading] = useState(true); // Flag de carregamento
  const [countdown, setCountdown] = useState(5); // Contagem regressiva
  const router = useRouter(); // Hook de navegação

  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const codigoVerificacao = localStorage.getItem("codigo_verificacao");
        const email = localStorage.getItem("email");
        const nomeBanco = localStorage.getItem("nome_banco");

        if (!codigoVerificacao || !email || !nomeBanco) {
          console.log(
            "Dados do cliente não encontrados, redirecionando para login.",
          );
          router.push("/login");
          return;
        }

        const permissionsResponse = await fetch(
          `/api/checkPermissions?codigoVerificacao=${codigoVerificacao}&email=${email}&nomeBanco=${nomeBanco}`,
        );
        const permissionsData = await permissionsResponse.json();

        if (permissionsResponse.status !== 200) {
          console.log("Erro ao buscar permissões", permissionsData);
          setAcessoPermitido(false);
          startRedirect(); // Inicia a contagem regressiva para redirecionamento
          return;
        }

        // Verificar se o usuário tem permissão para acessar a página
        const hasPermission = permissionsData.permissoes.some(
          (perm: any) => perm.nome_pagina === "Dashboard" && perm.ativado,
        );

        if (!hasPermission) {
          setAcessoPermitido(false);
          startRedirect(); // Inicia a contagem regressiva para redirecionamento
        }
      } catch (error) {
        console.error("Erro ao buscar permissões", error);
        startRedirect(); // Em caso de erro, inicia a contagem regressiva para redirecionamento
      } finally {
        setLoading(false);
      }
    };

    const startRedirect = () => {
      let timer = 5;
      const interval = setInterval(() => {
        setCountdown(timer);
        timer -= 1;
        if (timer < 0) {
          clearInterval(interval);
          router.push("/login"); // Redireciona para o login após a contagem regressiva
        }
      }, 1000);
    };

    fetchPermissions();
  }, [router]);

  // Exibe o carregamento enquanto verifica as permissões
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se o usuário não tiver permissão, exibe a mensagem de erro com ícone de cadeado
  if (!acessoPermitido) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-red-100 p-4 text-center">
        <FaLock className="mb-4 text-6xl text-red-500" />
        <h1 className="text-2xl font-bold text-red-600">
          Você não tem acesso a esta página
        </h1>
        <p className="mt-2 text-lg text-red-600">
          <strong>Contato necessário:</strong> Para acessar esta página, entre
          em contato com o administrador do sistema para solicitar elevação de
          permissões.
        </p>
        <div className="mt-4 text-xl text-red-600">
          <p>Você será redirecionado em {countdown}</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* <!-- ===== Page Wrapper Start ===== --> */}
      <div className="flex">
        {/* <!-- ===== Sidebar Start ===== --> */}
        <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        {/* <!-- ===== Sidebar End ===== --> */}

        {/* <!-- ===== Content Area Start ===== --> */}
        <div className="relative flex flex-1 flex-col lg:ml-72.5">
          {/* <!-- ===== Header Start ===== --> */}
          <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
          {/* <!-- ===== Header End ===== --> */}

          {/* <!-- ===== Main Content Start ===== --> */}
          <main>
            <div className="w-full p-4 md:p-6 2xl:p-10">{children}</div>
          </main>
          {/* <!-- ===== Main Content End ===== --> */}
        </div>
        {/* <!-- ===== Content Area End ===== --> */}
      </div>
      {/* <!-- ===== Page Wrapper End ===== --> */}
    </>
  );
}
