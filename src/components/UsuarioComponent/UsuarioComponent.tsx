"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Usuario {
  id: number;
  nome: string;
  email: string;
  senha: string;
  cargo: string;
  membro_id: number | null;
}

const UsuariosPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [cargo, setCargo] = useState("cooperador");
  const [membroId, setMembroId] = useState<number | null>(null);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);

  useEffect(() => {
    const codigoVerificacao = localStorage.getItem("codigo_verificacao");
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!codigoVerificacao || !nomeBanco) {
      toast.error("Chave de verificação ou banco não encontrados!");
      return;
    }

    const fetchUsuarios = async () => {
      try {
        const response = await fetch(`/api/fulluser?banco=${nomeBanco}`);
        const data = await response.json();
        if (Array.isArray(data)) {
          setUsuarios(data);
        } else {
          toast.error("Erro ao carregar usuários.");
        }
      } catch (error) {
        toast.error("Erro ao buscar usuários.");
      }
    };

    fetchUsuarios();
  }, []);

  const handleOpenForm = () => setIsEditing(true);
  const handleCloseForm = () => {
    setIsEditing(false);
    setEditingUser(null);
    setNome("");
    setEmail("");
    setSenha("");
    setCargo("cooperador");
    setMembroId(null);
  };

  const handleAddUser = async () => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
      return;
    }

    try {
      const response = await fetch(`/api/fulluseradd?banco=${nomeBanco}`, {
        method: "POST",
        body: JSON.stringify({
          nome,
          email,
          senha,
          cargo,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        setUsuarios(data.usuarios);
        toast.success("Usuário adicionado com sucesso!");
        handleCloseForm();
      } else {
        toast.error(data.message || "Erro ao adicionar usuário.");
      }
    } catch (error) {
      toast.error("Erro ao adicionar usuário.");
    }
  };

  const handleEditUser = async () => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
      return;
    }

    try {
      const response = await fetch(`/api/fulluseredit?banco=${nomeBanco}`, {
        method: "PUT",
        body: JSON.stringify({
          id: editingUser?.id,
          nome,
          email,
          senha,
          cargo,
          usuario_id: editingUser?.usuario_id,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        setUsuarios(data.usuarios);
        toast.success("Usuário atualizado com sucesso!");
        handleCloseForm();
      } else {
        toast.error(data.message || "Erro ao atualizar usuário.");
      }
    } catch (error) {
      toast.error("Erro ao atualizar usuário.");
    }
  };

  const handleDeleteUser = async (id: number) => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
      return;
    }

    try {
      const response = await fetch(
        `/api/fulluserdelete?id=${id}&banco=${nomeBanco}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();

      if (response.ok) {
        setUsuarios(usuarios.filter((u) => u.id !== id));
        toast.success("Usuário deletado com sucesso!");
      } else {
        toast.error(data.message || "Erro ao deletar usuário.");
      }
    } catch (error) {
      toast.error("Erro ao deletar usuário.");
    }
  };

  return (
    <div className="flex w-full">
      {/* Conteúdo da página com margem à esquerda para evitar sobreposição */}
      <div className="flex-1 bg-gray-100 p-6">
        <button
          onClick={handleOpenForm}
          className="rounded bg-media px-4 py-2 text-white"
        >
          + Novo Usuario
        </button>
        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-700 bg-opacity-50">
            <div className="w-full rounded-lg bg-white p-6 shadow-xl sm:w-3/4 md:w-1/2 lg:w-1/3">
              <h2 className="text-center text-xl font-bold">
                {editingUser ? "Editar Usuário" : "Adicionar Usuário"}
              </h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome"
                  required
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  required
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                />
                <input
                  type="password"
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="Senha"
                  required
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                />
                <select
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value)}
                  required
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                >
                  <option value="cooperador">Cooperador</option>
                  <option value="pastor">Pastor</option>
                  <option value="tesoureiro">Tesoureiro</option>
                  <option value="diacono">Diácono</option>
                  <option value="conselho_fiscal">Conselho Fiscal</option>
                </select>
                <button
                  onClick={editingUser ? handleEditUser : handleAddUser}
                  className="mr-4 mt-4 w-[10rem] rounded bg-media p-2 text-white"
                >
                  {editingUser ? "Salvar Alterações" : "Cadastrar Usuário"}
                </button>
                <button
                  onClick={handleCloseForm}
                  className="mt-2 w-[10rem] rounded bg-red-500 p-2 text-white"
                >
                  Fechar
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="mt-4">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="rounded bg-media shadow-xl">
                <th className="text-bold px-4 py-2 text-white">Nome</th>
                <th className="text-bold px-4 py-2 text-white">Email</th>
                <th className="text-bold px-4 py-2 text-white">Cargo</th>
                <th className="text-bold px-4 py-2 text-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario, index) => (
                <tr
                  className={`rounded-lg shadow-sm ${
                    index % 2 === 0 ? "bg-gray-200" : "bg-gray-100"
                  }`}
                  key={usuario.id}
                >
                  <td className="px-4 py-2 font-bold text-black">
                    {usuario.nome}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-black">
                    {usuario.email}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-black">
                    {usuario.cargo}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-black">
                    <button
                      onClick={() => {
                        setEditingUser(usuario);
                        setNome(usuario.nome);
                        setEmail(usuario.email);
                        setSenha(usuario.senha);
                        setCargo(usuario.cargo);
                        setIsEditing(true);
                      }}
                      className="rounded bg-media px-4 py-2 text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteUser(usuario.id)}
                      className="ml-2 rounded bg-red-500 px-4 py-2 text-white"
                    >
                      Deletar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ToastContainer position="top-right" />
    </div>
  );
};

export default UsuariosPage;
