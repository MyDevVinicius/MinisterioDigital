import React, { useEffect, useState } from "react";

interface Usuario {
  nome: string;
  cargo: string;
}

const UsuarioInfo: React.FC = () => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("email");
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!email || !nomeBanco) {
      setErro("Email ou nome do banco não encontrado no localStorage.");
      return;
    }

    // Fazer a requisição para a API
    fetch(`/api/usuarios?email=${email}&nome_banco=${nomeBanco}`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Erro ao buscar dados do usuário.");
        }
        return response.json();
      })
      .then((data) => {
        setUsuario(data);
      })
      .catch((error) => {
        console.error(error.message);
        setErro("Erro ao buscar informações do usuário.");
      });
  }, []);

  if (erro) {
    return <div className="erro">{erro}</div>;
  }

  if (!usuario) {
    return <div className="loading">Carregando informações...</div>;
  }

  return (
    <div className="usuario-info ml-[2.8rem]">
      <p className="text-[1.3rem] font-semibold text-media">{usuario.nome}</p>
      <p className="text-[13px] font-semibold text-gray-500">{usuario.cargo}</p>
    </div>
  );
};

export default UsuarioInfo;
