"use client"; // Adicione esta diretiva para marcar o componente como do lado do cliente

import "flatpickr/dist/flatpickr.min.css";
import "@/css/satoshi.css";
import "@/css/style.css";
import React, { useEffect, useState } from "react"; // Agora você pode usar useState e useEffect
import Loader from "@/components/common/Loader"; // Exemplo de carregamento

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [loading, setLoading] = useState<boolean>(true); // Usando o useState no cliente

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000); // Simula carregamento
  }, []);

  return (
    <html lang="pt-br">
      <body suppressHydrationWarning={true}>
        <div>{loading ? <Loader /> : children}</div>
      </body>
    </html>
  );
}
