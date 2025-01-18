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
  rg?: string;
  cpf?: string;
  estado_civil?: "solteiro" | "casado" | "divorciado" | "viuvo";
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
  const [rg, setRg] = useState("");
  const [cpf, setCpf] = useState("");
  const [estadoCivil, setEstadoCivil] = useState<
    "solteiro" | "casado" | "divorciado" | "viuvo"
  >("solteiro");
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
    setRg("");
    setCpf("");
    setEstadoCivil("solteiro");
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
      formData.append("rg", rg);
      formData.append("cpf", cpf);
      formData.append("estado_civil", estadoCivil);

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

    // Remover a máscara do campo 'numero'
    const numeroSemMascara = numero.replace(/\D/g, ""); // Remove tudo que não for número

    try {
      const dataToSend = {
        id: String(editingMembro?.id),
        nome,
        data_nascimento: formattedDataNascimento,
        endereco,
        status,
        numero: numeroSemMascara, // Envia o número sem a máscara
        email,
        rg,
        cpf,
        estado_civil: estadoCivil,
      };

      let response;
      if (image) {
        const formData = new FormData();
        formData.append("id", String(editingMembro?.id));
        formData.append("nome", nome);
        formData.append("data_nascimento", formattedDataNascimento);
        formData.append("endereco", endereco);
        formData.append("status", status);
        formData.append("numero", numeroSemMascara); // Número sem máscara
        formData.append("email", email);
        formData.append("rg", rg);
        formData.append("cpf", cpf);
        formData.append("estado_civil", estadoCivil);
        formData.append("image", image);

        response = await fetch(`/api/membrosedit?banco=${nomeBanco}`, {
          method: "PUT",
          body: formData,
        });
      } else {
        response = await fetch(`/api/membrosedit?banco=${nomeBanco}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(dataToSend),
        });
      }

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

  const handleDeleteMembro = async (id: number) => {
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!nomeBanco) {
      toast.error("Nome do banco não encontrado!");
      return;
    }

    try {
      const response = await fetch(
        `/api/membrosdelete?banco=${nomeBanco}&id=${id}`,
        {
          method: "DELETE",
        },
      );

      const data = await response.json();

      if (response.ok) {
        setMembros(data.membros);
        toast.success("Membro deletado com sucesso!");
      } else {
        toast.error(data.message || "Erro ao deletar membro.");
      }
    } catch (error) {
      toast.error("Erro ao deletar membro.");
    }
  };

  const handleOpenFormEdit = (membro: Membro) => {
    setIsEditing(true);
    setEditingMembro(membro);
    setNome(membro.nome);

    const [dia, mes, ano] = membro.data_nascimento.split("/");
    const dataFormatada = `${ano}-${mes}-${dia}`;
    setDataNascimento(dataFormatada);
    setEndereco(membro.endereco || "");
    setStatus(membro.status);
    setNumero(membro.numero || "");
    setEmail(membro.email || "");
    setRg(membro.rg || "");
    setCpf(membro.cpf || "");
    setEstadoCivil(membro.estado_civil || "solteiro");
  };

  const handleOpenCarteirinha = (membro: Membro) => {
    setCarteiraMembro(membro);
    generateCarteirinhaPDF(membro); // Adicionando a função para gerar o PDF
  };

  const convertToPx = (size: string) => {
    // Converte rem para px assumindo 16px como base
    if (size.endsWith("rem")) {
      return parseFloat(size) * 26;
    } else if (size.endsWith("px")) {
      return parseFloat(size);
    }
    // Caso não seja nem rem nem px, retorna o valor como está (assumido em px)
    return parseFloat(size);
  };

  const generateCarteirinhaPDF = (
    membro: Membro,
    fontSizes: {
      nome: string;
      estadoCivil: string;
      data_nascimento: string;
      status: string;
      rg: string;
      cpf: string;
      igreja: string;
      dataEmissao: string;
      dataVencimento: string; // Tamanho da fonte para as datas
    } = {
      nome: "40px",
      estadoCivil: "45px",
      data_nascimento: "45px",
      status: "40px",
      rg: "40px",
      cpf: "45px",
      igreja: "45px",
      dataEmissao: "30px", // Definindo o tamanho da fonte para a data de emissão
      dataVencimento: "30px", // Definindo o tamanho da fonte para a data de vencimento
    },
  ) => {
    const doc = new jsPDF("landscape", "px", [2028, 637]);
    const modeloUrl = "/modelo-carteirinha.png";
    doc.addImage(modeloUrl, "PNG", 0, 0, 2028, 637);

    // Converter tamanhos das fontes
    const nomeFontSize = convertToPx(fontSizes.nome);
    const estadoCivilFontSize = convertToPx(fontSizes.estadoCivil);
    const dataNascimentoFontSize = convertToPx(fontSizes.data_nascimento);
    const statusFontSize = convertToPx(fontSizes.status);
    const rgFontSize = convertToPx(fontSizes.rg);
    const cpfFontSize = convertToPx(fontSizes.cpf);
    const igrejaFontSize = convertToPx(fontSizes.igreja);
    const dataEmissaoFontSize = convertToPx(fontSizes.dataEmissao);
    const dataVencimentoFontSize = convertToPx(fontSizes.dataVencimento);

    // Nome da igreja
    const nomeIgreja =
      localStorage.getItem("nome_igreja") || "Nome da Igreja Não Informado";
    doc.setFontSize(igrejaFontSize);
    doc.text(nomeIgreja, 680, 485); // Posição ajustada para o nome da igreja

    // Nome do membro
    doc.setFont("helvetica", "normal");
    doc.setFontSize(nomeFontSize);
    doc.text(`${membro.nome || "Não informado"}`, 390, 200);

    // Estado civil
    doc.setFontSize(estadoCivilFontSize);
    doc.text(`${membro.estado_civil || "Não informado"}`, 730, 395);

    // Data de nascimento
    doc.setFontSize(dataNascimentoFontSize);
    doc.text(`${membro.data_nascimento || "Não informado"}`, 390, 400);

    // Status
    doc.setFontSize(statusFontSize);
    doc.text(`${membro.status || "Não informado"}`, 390, 485);

    // RG
    doc.setFontSize(rgFontSize);
    doc.text(`${membro.rg || "Não informado"}`, 390, 300);

    // CPF
    doc.setFontSize(cpfFontSize);
    doc.text(`${membro.cpf || "Não informado"}`, 700, 300);

    // Adicionando as datas
    const hoje = new Date();
    const dataEmissao = hoje.toLocaleDateString("pt-BR"); // Formato dd/mm/yyyy
    doc.setFontSize(dataEmissaoFontSize);
    doc.text(`Data de Emissão: ${dataEmissao}`, 40, 539); // Ajustar a posição para a data de emissão

    // Calcular a data de vencimento (um ano depois)
    hoje.setFullYear(hoje.getFullYear() + 1);
    const dataVencimento = hoje.toLocaleDateString("pt-BR");
    doc.setFontSize(dataVencimentoFontSize);
    doc.text(`Data de Vencimento: ${dataVencimento}`, 40, 580); // Ajustar a posição para a data de vencimento

    // Salvar o PDF
    doc.save(`${membro.nome}-carteirinha.pdf`);
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

              <form
                onSubmit={(e) => e.preventDefault()}
                className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3"
              >
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Nome"
                  required
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="date"
                  value={dataNascimento}
                  onChange={(e) => setDataNascimento(e.target.value)}
                  placeholder="Data de Nascimento"
                  required
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="text"
                  value={endereco}
                  onChange={(e) => setEndereco(e.target.value)}
                  placeholder="Endereço"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="text"
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  placeholder="WhatsApp"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="text"
                  value={rg}
                  onChange={(e) => setRg(e.target.value)}
                  placeholder="RG"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                />
                <input
                  type="text"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  placeholder="CPF"
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                  onInput={(e) => {
                    e.target.value = e.target.value.replace(
                      /^(\d{3})(\d{3})(\d{3})(\d{2}).*/,
                      "$1.$2.$3-$4",
                    );
                  }}
                />
                <select
                  value={estadoCivil}
                  onChange={(e) =>
                    setEstadoCivil(e.target.value as typeof estadoCivil)
                  }
                  className="my-2 w-full border border-media p-2 text-sm font-bold text-black lg:text-base"
                >
                  <option value="solteiro">Solteiro</option>
                  <option value="casado">Casado</option>
                  <option value="divorciado">Divorciado</option>
                  <option value="viuvo">Viúvo</option>
                </select>
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

                <div className="col-span-full mt-4 flex justify-between">
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
                <th className="px-4 py-2 text-left">RG</th> {/* Novo campo */}
                <th className="px-4 py-2 text-left">CPF</th> {/* Novo campo */}
                <th className="px-4 py-2 text-left">Estado Civil</th>{" "}
                {/* Novo campo */}
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
                    <td className="px-4 py-2">{membro.rg}</td>{" "}
                    {/* Novo campo */}
                    <td className="px-4 py-2">{membro.cpf}</td>{" "}
                    {/* Novo campo */}
                    <td className="px-4 py-2">{membro.estado_civil}</td>{" "}
                    {/* Novo campo */}
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
                  <td colSpan={9} className="py-4 text-center text-gray-600">
                    Não há membros cadastrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default MembrosList;
