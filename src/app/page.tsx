"use client"; // Isso é necessário porque estamos usando o useRouter, que é um hook de cliente

import { useEffect } from "react";
import { useRouter } from "next/navigation"; // Importar o hook useRouter

export default function Home() {
  const router = useRouter(); // Inicializando o router

  useEffect(() => {
    // Redireciona automaticamente para a página de login
    router.push("/login"); // Altere "/login" se a URL da sua página de login for diferente
  }, [router]); // O useEffect é chamado uma vez quando o componente é montado

  return <div>Redirecionando para o login...</div>; // Exibe algo enquanto o redirecionamento acontece
}
