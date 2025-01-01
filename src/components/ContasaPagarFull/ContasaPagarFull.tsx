"use client";

import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaEdit, FaTrash } from "react-icons/fa";

interface ContaAPagar {
  id: number;
  observacao: string;
  valor: string;
  valor_pago: string;
  data_vencimento: string;
  status: string;
}

const ContasAPagarList: React.FC = () => {
  const [contas, setContas] = useState<ContaAPagar[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("Todos");
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [editingConta, setEditingConta] = useState<ContaAPagar | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [notificationShown, setNotificationShown] = useState<boolean>(false);

  const fetchContas = async () => {
    try {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        toast.error("Chave de verificação ou nome do banco não encontrados.");
        return;
      }

      const response = await fetch(
        `/api/contasapagar?chave=${chave}&banco=${nomeBanco}`,
      );
      const data = await response.json();

      if (response.ok) {
        setContas(data.data);
        if (!notificationShown) {
          setNotificationShown(true);
        }
      } else {
        toast.error(data.message || "Erro ao carregar contas.");
      }
    } catch (error) {
      console.error("Erro ao buscar contas:", error);
      toast.error("Erro ao buscar contas");
    }
  };

  const deleteConta = async (id: number) => {
    try {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        toast.error("Chave de verificação ou nome do banco não encontrados.");
        console.error("Chave ou nomeBanco faltando:", { chave, nomeBanco });
        return;
      }

      const response = await fetch(`/api/contasapagardelete/${id}`, {
        method: "DELETE",
        headers: {
          "x-nome-banco": nomeBanco, // Corrigido
          "x-verificacao-chave": chave,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setContas((prev) => prev.filter((conta) => conta.id !== id));
        toast.success("Conta excluída com sucesso!");
      } else {
        toast.error(data.message || "Erro ao excluir conta.");
      }
    } catch (error) {
      console.error("Erro ao excluir conta:", error);
      toast.error("Erro ao excluir conta");
    }
  };

  const editConta = async (updatedConta: ContaAPagar) => {
    try {
      // Lógica de verificação do status
      const today = new Date();
      const dataVencimento = new Date(updatedConta.data_vencimento);
      const valorPago = parseFloat(updatedConta.valor_pago);
      const valorTotal = parseFloat(updatedConta.valor);

      let status = "Pendente"; // Default status

      if (valorPago === valorTotal) {
        status = "Pago"; // Se o valor pago for igual ao valor total, o status é 'Pago'
      } else if (valorPago < valorTotal && valorPago > 0) {
        status = "Pago Parcial"; // Se o valor pago for menor que o valor total, mas maior que zero, é 'Pago Parcial'
      }

      if (status === "Pendente" && dataVencimento < today) {
        status = "Vencida"; // Se a data de vencimento for anterior ao hoje e o status for 'Pendente', alteramos para 'Vencida'
      }

      // Atualiza o status no objeto
      updatedConta.status = status;

      // Obtenha os valores do localStorage
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      // Adicione essas informações ao objeto atualizado da conta (se necessário)
      const updatedContaWithLocalStorage = {
        ...updatedConta,
        nomeBanco, // Passa o nomeBanco do localStorage
      };

      const response = await fetch(`/api/contasapagaredit/${updatedConta.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedContaWithLocalStorage), // Envia o objeto atualizado com os dados do localStorage
      });

      const data = await response.json();

      if (response.ok) {
        setContas((prev) =>
          prev.map((conta) =>
            conta.id === updatedConta.id ? updatedConta : conta,
          ),
        );
        setIsEditing(false);
        setEditingConta(null);
        toast.success("Conta atualizada com sucesso!");
      } else {
        toast.error(data.message || "Erro ao atualizar conta.");
      }
    } catch (error) {
      console.error("Erro ao atualizar conta:", error);
      toast.error("Erro ao atualizar conta");
    }
  };

  useEffect(() => {
    fetchContas();
    const timer = setTimeout(() => {
      setNotificationShown(false);
    }, 5000); // Limpa a notificação após 5 segundos

    return () => clearTimeout(timer);
  }, []);

  const formatarValor = (valor: string) =>
    `R$ ${parseFloat(valor).toFixed(2).replace(".", ",")}`;

  const formatarData = (data: string) => {
    const date = new Date(data);
    return date.toLocaleDateString("pt-BR");
  };

  const getStatusClasses = (status: string) => {
    const statusClasses: Record<string, string> = {
      Pago: "bg-green-100 text-green-900 font-bold",
      Pendente: "bg-orange-100 text-orange-900 font-bold",
      "Pago Parcial": "bg-purple-100 text-purple-900 font-bold",
      Vencida: "bg-red-100 text-red-900 font-bold",
    };
    return statusClasses[status] || "bg-gray-200 text-gray-900 font-bold";
  };

  const contasFiltradas = contas.filter((conta) => {
    const dataVencimento = new Date(conta.data_vencimento);
    const startDate = startDateFilter ? new Date(startDateFilter) : null;
    const endDate = endDateFilter ? new Date(endDateFilter) : null;
    const today = new Date();

    const matchesStatus =
      statusFilter === "Todos" ||
      (statusFilter === "Vencida" &&
        conta.status === "Pendente" &&
        dataVencimento < today) ||
      statusFilter === conta.status;

    const matchesStartDate = !startDate || dataVencimento >= startDate;
    const matchesEndDate = !endDate || dataVencimento <= endDate;

    return matchesStatus && matchesStartDate && matchesEndDate;
  });

  return (
    <div className="mx-auto mt-4 w-full max-w-full space-y-4 rounded-lg p-4 shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_-4px_6px_rgba(0,0,0,0.1)]">
      <ToastContainer />
      <h1 className="text-[1.4rem] font-bold text-gray-700">
        Resumo de Contas
      </h1>
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-md border p-2 text-gray-700 sm:w-auto"
        >
          <option value="Todos">Todos</option>
          <option value="Vencida">Vencida</option>
          <option value="Pago">Pago</option>
          <option value="Pago Parcial">Pago Parcial</option>
          <option value="Pendente">Pendente</option>
        </select>

        <input
          type="date"
          value={startDateFilter}
          onChange={(e) => setStartDateFilter(e.target.value)}
          className="w-full rounded-md border p-2 text-gray-700 sm:w-auto"
        />
        <input
          type="date"
          value={endDateFilter}
          onChange={(e) => setEndDateFilter(e.target.value)}
          className="w-full rounded-md border p-2 text-gray-700 sm:w-auto"
        />
      </div>

      <table className="mt-4 w-full table-auto border-collapse overflow-hidden rounded-lg text-gray-700">
        <thead className="rounded-t-lg bg-gray-100">
          <tr>
            <th className="border p-2 text-left">Observação</th>
            <th className="border p-2 text-center">Valor</th>
            <th className="border p-2 text-center">Valor Pago</th>
            <th className="border p-2 text-center">Vencimento</th>
            <th className="border p-2 text-center">Status</th>
            <th className="border p-2 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {contasFiltradas.map((conta) => (
            <tr
              key={conta.id}
              className={`border ${getStatusClasses(conta.status)}`}
            >
              <td className="p-2">{conta.observacao}</td>
              <td className="p-2 text-center">{formatarValor(conta.valor)}</td>
              <td className="p-2 text-center">
                {formatarValor(conta.valor_pago)}
              </td>
              <td className="p-2 text-center">
                {formatarData(conta.data_vencimento)}
              </td>
              <td className="p-2 text-center">{conta.status}</td>
              <td className="flex justify-center gap-2 p-2 text-center">
                <button
                  onClick={() => {
                    setEditingConta(conta);
                    setIsEditing(true);
                  }}
                  className="mr-[1rem] text-2xl font-bold text-media"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteConta(conta.id)}
                  className="text-1xl font-bold text-red-500"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isEditing && editingConta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-[40rem] rounded-md bg-white p-6 shadow-md">
            <h2 className="mb-4 text-lg font-bold">Editar Conta</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Observação
              </label>
              <input
                type="text"
                value={editingConta.observacao}
                onChange={(e) =>
                  setEditingConta({
                    ...editingConta,
                    observacao: e.target.value,
                  })
                }
                className="w-full rounded-md border p-2 text-black"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Valor
              </label>
              <input
                type="text"
                value={editingConta.valor}
                onChange={(e) =>
                  setEditingConta({ ...editingConta, valor: e.target.value })
                }
                className="w-full rounded-md border p-2 text-black"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Valor Pago
              </label>
              <input
                type="text"
                value={editingConta.valor_pago}
                onChange={(e) =>
                  setEditingConta({
                    ...editingConta,
                    valor_pago: e.target.value,
                  })
                }
                className="w-full rounded-md border p-2 text-black"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Data de Vencimento
              </label>
              <input
                type="date"
                value={editingConta.data_vencimento.split("T")[0]} // Corretamente formatado para 'YYYY-MM-DD'
                onChange={(e) =>
                  setEditingConta({
                    ...editingConta,
                    data_vencimento: e.target.value,
                  })
                }
                className="w-full rounded-md border p-2 text-black"
              />
            </div>

            <div className="flex justify-start gap-4">
              <button
                onClick={() => {
                  // Lógica para verificar o status da conta ao editar
                  const updatedConta = { ...editingConta };
                  const today = new Date();
                  const dueDate = new Date(updatedConta.data_vencimento);
                  const valorPago = parseFloat(updatedConta.valor_pago);
                  const valorTotal = parseFloat(updatedConta.valor);

                  // Lógica de atualização do status
                  if (valorPago === valorTotal) {
                    updatedConta.status = "Pago";
                  } else if (valorPago === 0) {
                    updatedConta.status =
                      dueDate < today ? "Vencida" : "Pendente";
                  } else if (valorPago < valorTotal && dueDate < today) {
                    updatedConta.status = "Pago Parcial";
                  }

                  editConta(updatedConta);
                }}
                className="rounded-md bg-media px-4 py-2 text-white"
              >
                Atualizar
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingConta(null);
                }}
                className="rounded-md bg-red-500 px-4 py-2 text-white"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContasAPagarList;
