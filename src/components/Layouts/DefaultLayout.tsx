"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation"; // Importa o useRouter para redirecionamento
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";

export default function DefaultLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [acessoPermitido, setAcessoPermitido] = useState(true); // Flag para verificar se o usuário tem permissão
  const [loading, setLoading] = useState(true); // Flag de carregamento
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
          return;
        }

        // Verificar se o usuário tem permissão para acessar a página
        const hasPermission = permissionsData.permissoes.some(
          (perm: any) => perm.nome_pagina === "Dashboard" && perm.ativado,
        );

        if (!hasPermission) {
          setAcessoPermitido(false);
        }
      } catch (error) {
        console.error("Erro ao buscar permissões", error);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [router]);

  // Exibe o carregamento enquanto verifica as permissões
  if (loading) {
    return <div>Carregando...</div>;
  }

  // Se o usuário não tiver permissão, exibe a mensagem de erro
  if (!acessoPermitido) {
    return <div>Você não tem permissão para acessar esta página.</div>;
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
