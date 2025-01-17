"use client";

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { FaEdit, FaTrashAlt, FaIdCard } from "react-icons/fa";
import "react-toastify/dist/ReactToastify.css";
import { jsPDF } from "jspdf";

interface Membro {
  id: number;
  nome: string;
  data_nascimento: string;
  endereco: string;
  status: "ativo" | "inativo";
  usuario_id: number | null;
  numero?: string;
  email?: string;
  imagem?: string;
}

const MembrosList: React.FC = () => {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [nome, setNome] = useState("");
  const [dataNascimento, setDataNascimento] = useState("");
  const [endereco, setEndereco] = useState("");
  const [status, setStatus] = useState<"ativo" | "inativo">("ativo");
  const [numero, setNumero] = useState("");
  const [email, setEmail] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [editingMembro, setEditingMembro] = useState<Membro | null>(null);
  const [carteiraMembro, setCarteiraMembro] = useState<Membro | null>(null);

  useEffect(() => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
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
    setNumero("");
    setEmail("");
    setImage(null);
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
      const formData = new FormData();
      formData.append("nome", nome);
      formData.append("data_nascimento", formattedDataNascimento);
      formData.append("endereco", endereco);
      formData.append("status", status);
      formData.append("numero", numero);
      formData.append("email", email);

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`/api/membrosadd?banco=${nomeBanco}`, {
        method: "POST",
        body: formData,
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
      const formData = new FormData();
      formData.append("id", String(editingMembro?.id));
      formData.append("nome", nome);
      formData.append("data_nascimento", formattedDataNascimento);
      formData.append("endereco", endereco);
      formData.append("status", status);
      formData.append("numero", numero);
      formData.append("email", email);

      if (image) {
        formData.append("image", image);
      }

      const response = await fetch(`/api/membrosedit?banco=${nomeBanco}`, {
        method: "PUT",
        body: formData,
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

    // Formatação da data de nascimento para o formato correto (yyyy-mm-dd)
    const [dia, mes, ano] = membro.data_nascimento.split("/");
    const dataFormatada = `${ano}-${mes}-${dia}`;
    setDataNascimento(dataFormatada);
    setEndereco(membro.endereco || "");
    setStatus(membro.status);
    setNumero(membro.numero || "");
    setEmail(membro.email || "");
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validTypes = ["image/png", "image/jpeg"];
      if (!validTypes.includes(file.type)) {
        toast.error("Por favor, envie uma imagem PNG ou JPG.");
        return;
      }
      setImage(file);
    }
  };

  const handleOpenCarteirinha = (membro: Membro) => {
    setCarteiraMembro(membro);
  };

  const generateCarteirinhaPDF = (membro: Membro) => {
    // Configuração do jsPDF com orientação e tamanho de uma carteirinha aberta
    const doc = new jsPDF("landscape", "px", [2028, 637]); // Tamanho de uma carteirinha aberta (2028x637 px)

    // Adicionar o fundo da carteirinha
    const modeloUrl = "/modelo-carteirinha.png"; // Caminho correto para a imagem no diretório public
    doc.addImage(modeloUrl, "PNG", 0, 0, 2028, 637); // Fundo cobrindo toda a carteirinha aberta

    // Configuração de fonte
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12); // Ajuste no tamanho da fonte para melhorar a legibilidade

    // Adicionar informações do membro no layout
    // Lado esquerdo (posição no layout)
    doc.text(`Nome: ${membro.nome || "Não informado"}`, 40, 60); // Ajuste das posições

    // Lado direito (posição no layout)
    doc.text(`Pai: ${membro.pai || "Não informado"}`, 1000, 60); // Ajuste das posições
    doc.text(`Mãe: ${membro.mae || "Não informado"}`, 1000, 80);
    doc.text(
      `Naturalidade: ${membro.naturalidade || "Não informado"}`,
      1000,
      100,
    );
    doc.text(`Sexo: ${membro.sexo || "Não informado"}`, 1000, 120);
    doc.text(
      `Nacionalidade: ${membro.nacionalidade || "Não informado"}`,
      1000,
      140,
    );
    doc.text(
      `Estado Civil: ${membro.estadoCivil || "Não informado"}`,
      1000,
      160,
    );

    // RG e CPF
    doc.text(`RG: ${membro.rg || "Não informado"}`, 40, 160);
    doc.text(`CPF: ${membro.cpf || "Não informado"}`, 250, 160);

    // Assinatura do Pastor Presidente no rodapé
    doc.setFontSize(10); // Ajuste do tamanho da fonte para o rodapé
    doc.text("Nome do Pastor Presidente", 1000, 600); // Ajuste da posição para o rodapé

    // Salvar o PDF
    doc.save(`${membro.nome}-carteirinha.pdf`);
  };

  const renderCarteirinha = (membro: Membro) => {
    const imagemUrl = membro.imagem
      ? `/api/serveImage?filename=${membro.imagem}`
      : "/default-avatar.png";

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-500 bg-opacity-50">
        <div className="w-64 rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-4 flex justify-center">
            <img
              src={imagemUrl}
              alt="Imagem do Membro"
              className="h-24 w-24 rounded-full border-4 border-media"
            />
          </div>
          <h3 className="text-center text-lg font-bold">{membro.nome}</h3>
          <p className="text-center text-sm text-gray-600">{membro.status}</p>
          <p className="mt-2 text-center text-sm">
            Data Nascimento:{" "}
            {new Date(membro.data_nascimento).toLocaleDateString()}
          </p>
          <p className="text-center text-sm">Telefone: {membro.numero}</p>
          <p className="text-center text-sm">Email: {membro.email}</p>
          <button
            onClick={() => setCarteiraMembro(null)}
            className="mt-4 w-full rounded bg-red-500 p-2 text-white"
          >
            Fechar
          </button>
          <button
            onClick={() => generateCarteirinhaPDF(membro)}
            className="mt-4 w-full rounded bg-green-500 p-2 text-white"
          >
            Baixar PDF
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-full flex-col lg:flex-row">
      <div className="flex-1 p-6">
        <button
          onClick={handleOpenForm}
          className="rounded bg-media px-4 py-2 text-sm text-white lg:text-base"
        >
          + Novo Membro
        </button>

        {isEditing && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div className="w-full rounded-lg bg-white p-6 shadow-xl sm:w-3/4 md:w-1/2 lg:w-1/3">
              <h2 className="text-center text-lg font-bold sm:text-xl">
                {editingMembro ? "Editar Membro" : "Adicionar Membro"}
              </h2>
              <form onSubmit={(e) => e.preventDefault()}>
                <input
                  type="text"
                  value={nome || ""}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome"
                  required
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="date"
                  value={dataNascimento || ""}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  placeholder="Data de Nascimento"
                  required
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="text"
                  value={endereco || ""}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="text"
                  value={numero || ""}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="WhatsApp"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="email"
                  value={email || ""}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <select
                  value={status}
                  onChange={(e) =>
                    setStatus(e.target.value as "ativo" | "inativo")
                  }
                  required
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>

                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  onChange={handleImageUpload}
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />

                <div className="mt-4 flex justify-between">
                  <button
                    type="button"
                    onClick={handleCloseForm}
                    className="rounded bg-gray-400 px-4 py-2 text-sm text-white"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={editingMembro ? handleEditMembro : handleAddMembro}
                    className="rounded bg-media px-4 py-2 text-sm text-white"
                  >
                    {editingMembro ? "Salvar Alterações" : "Adicionar"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="my-4 overflow-auto rounded-lg border border-gray-200">
          <table className="min-w-full table-auto text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">Nome</th>
                <th className="px-4 py-2 text-left">Data Nascimento</th>
                <th className="px-4 py-2 text-left">Endereço</th>
                <th className="px-4 py-2 text-left">WhatsApp</th>
                <th className="px-4 py-2 text-left">Email</th>
                <th className="px-4 py-2 text-left">Ações</th>
              </tr>
            </thead>
            <tbody>
              {membros.length > 0 ? (
                membros.map((membro) => (
                  <tr key={membro.id} className="border-t">
                    <td className="px-4 py-2">{membro.nome}</td>
                    <td className="px-4 py-2">
                      {membro.data_nascimento || "Data inválida"}
                    </td>

                    <td className="px-4 py-2">{membro.endereco}</td>
                    <td className="px-4 py-2">{membro.numero}</td>
                    <td className="px-4 py-2">{membro.email}</td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => handleOpenCarteirinha(membro)}
                        className="mr-2 text-green-600"
                      >
                        <FaIdCard />
                      </button>
                      <button
                        onClick={() => handleOpenFormEdit(membro)}
                        className="mr-2 text-yellow-500"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => handleDeleteMembro(membro.id)}
                        className="text-red-600"
                      >
                        <FaTrashAlt />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-4 text-center text-gray-600">
                    Não há membros cadastrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      {carteiraMembro && renderCarteirinha(carteiraMembro)}
    </div>
  );
};

export default MembrosList;
