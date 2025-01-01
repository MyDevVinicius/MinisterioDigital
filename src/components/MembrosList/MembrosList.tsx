"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Membro {
  id: number;
  nome: string;
  data_nascimento: string;
  endereco: string;
  status: "ativo" | "inativo";
  usuario_id: number | null;
}

const MembrosList: React.FC = () => {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null);

  useEffect(() => {
    const codigoVerificacao = localStorage.getItem("codigo_verificacao");
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!codigoVerificacao || !nomeBanco) {
      toast.error("Chave de verificação ou banco não encontrados!");
      return;
    }

    const fetchMembros = async () => {
      try {
        const response = await fetch(`/api/membroslist?banco=${nomeBanco}`);
        const data = await response.json();
        if (Array.isArray(data.membros)) {
          setMembros(data.membros);
        } else {
          toast.error("Erro ao carregar membros.");
        }
      } catch (error) {
        toast.error("Erro ao buscar membros.");
      }
    };

    fetchMembros();
  }, []);

  const handleOpenForm = () => setIsEditing(true);

  const handleCloseForm = () => {
    setIsEditing(false);
    setEditingMembro(null);
    setNome("");
    setDataNascimento("");
    setEndereco("");
    setStatus("ativo");
  };

  const handleAddMembro = async () => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
      return;
    }

    const formattedDataNascimento = new Date(dataNascimento)
      .toISOString()
      .split("T")[0];

    try {
      const response = await fetch(`/api/membrosadd?banco=${nomeBanco}`, {
        method: "POST",
        body: JSON.stringify({
          nome,
          data_nascimento: formattedDataNascimento,
          endereco,
          status,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        setMembros(data.membros);
        toast.success("Membro adicionado com sucesso!");
        handleCloseForm();
      } else {
        toast.error(data.message || "Erro ao adicionar membro.");
      }
    } catch (error) {
      toast.error("Erro ao adicionar membro.");
    }
  };

  const handleEditMembro = async () => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
      return;
    }

    const formattedDataNascimento = new Date(dataNascimento)
      .toISOString()
      .split("T")[0];

    try {
      const response = await fetch(`/api/membrosedit?banco=${nomeBanco}`, {
        method: "PUT",
        body: JSON.stringify({
          id: editingMembro?.id,
          nome,
          data_nascimento: formattedDataNascimento,
          endereco,
          status,
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();

      if (response.ok) {
        setMembros(data.membros);
        toast.success("Membro atualizado com sucesso!");
        handleCloseForm();
      } else {
        toast.error(data.message || "Erro ao atualizar membro.");
      }
    } catch (error) {
      toast.error("Erro ao atualizar membro.");
    }
  };

  const handleOpenFormEdit = (membro: Membro) => {
    setIsEditing(true);
    setEditingMembro(membro);
    setNome(membro.nome);

    // Converter data no formato DD/MM/YYYY para YYYY-MM-DD
    const [dia, mes, ano] = membro.data_nascimento.split("/");
    const dataFormatada = `${ano}-${mes}-${dia}`;

    // Validar a data formatada
    const dataValida = !isNaN(new Date(dataFormatada).getTime());
    if (dataValida) {
      setDataNascimento(new Date(dataFormatada).toISOString().split("T")[0]);
    } else {
      setDataNascimento(""); // Ou defina um valor padrão
      console.error(`Data de nascimento inválida: ${membro.data_nascimento}`);
    }

    setEndereco(membro.endereco || "");
    setStatus(membro.status);
  };

  const handleDeleteMembro = async (id: number) => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
      return;
    }

    try {
      const response = await fetch(
        `/api/membrosdelete?id=${id}&banco=${nomeBanco}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
          },
        },
      );
      const data = await response.json();

      if (response.ok) {
        setMembros(membros.filter((membro) => membro.id !== id));
        toast.success("Membro deletado com sucesso!");
      } else {
        toast.error(data.message || "Erro ao deletar membro.");
      }
    } catch (error) {
      toast.error("Erro ao deletar membro.");
    }
  };

  return (
    <div className="flex w-full">
      <div className="flex-1 p-6">
        <button
          onClick={handleOpenForm}
          className="rounded bg-media px-4 py-2 text-white"
        >
          + Novo Membro
        </button>

        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="w-full rounded-lg bg-white p-6 shadow-xl sm:w-3/4 md:w-1/2 lg:w-1/3">
              <h2 className="text-center text-xl font-bold">
                {editingMembro ? "Editar Membro" : "Adicionar Membro"}
              </h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  value={nome || ""}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome"
                  required
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                />
                <input
                  type="date"
                  value={dataNascimento || ""}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  placeholder="Data de Nascimento"
                  required
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                />
                <input
                  type="text"
                  value={endereco || ""}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço"
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                />
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "ativo" | "inativo")
                  }
                  required
                  className="my-2 w-full border border-media p-2 font-bold text-black"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>

                <button
                  onClick={editingMembro ? handleEditMembro : handleAddMembro}
                  className="mr-4 mt-4 w-[14rem] rounded bg-media p-2 text-white"
                >
                  {editingMembro ? "Salvar Alterações" : "Cadastrar Membro"}
                </button>
                <button
                  onClick={handleCloseForm}
                  className="mt-2 w-[8rem] rounded bg-red-500 p-2 text-white"
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
                <th className="text-bold px-4 py-2 text-white">
                  Data Nascimento
                </th>
                <th className="text-bold px-4 py-2 text-white">Endereço</th>
                <th className="text-bold px-4 py-2 text-white">Status</th>
                <th className="text-bold px-4 py-2 text-white">Ações</th>
              </tr>
            </thead>
            <tbody>
              {membros.map((membro) => (
                <tr key={membro.id} className="pd-[20px] rounded-lg shadow-sm">
                  <td className="px-4 py-2 text-center font-bold text-black">
                    {membro.nome}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-black">
                    {membro.data_nascimento}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-black">
                    {membro.endereco}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-black">
                    {membro.status}
                  </td>
                  <td className="px-4 py-2 text-center font-bold text-black">
                    <button
                      onClick={() => handleOpenFormEdit(membro)}
                      className="mr-2 rounded bg-media px-4 py-2 text-white"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteMembro(membro.id)}
                      className="rounded bg-red-500 px-4 py-2 text-white"
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

      <ToastContainer />
    </div>
  );
};

export default MembrosList;
