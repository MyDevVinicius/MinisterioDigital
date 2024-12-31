import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify"; // Importa a função toast para mostrar mensagens

interface Entrada {
  id: number;
  observacao: string;
  tipo: string;
  forma_pagamento: string;
  valor: string;
  data_Lancamento: string;
  membro_id: number;
}

const EntradasList: React.FC = () => {
  const [entradas, setEntradas] = useState<Entrada[]>([]);
  const [startDateFilter, setStartDateFilter] = useState<string>("");
  const [endDateFilter, setEndDateFilter] = useState<string>("");
  const [editingEntrada, setEditingEntrada] = useState<Entrada | null>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [observacao, setObservacao] = useState<string>("");
  const [tipo, setTipo] = useState<string>("");
  const [formaPagamento, setFormaPagamento] = useState<string>("");
  const [valor, setValor] = useState<string>("");
  const [dataLancamento, setDataLancamento] = useState<string>("");
  const [notificationShown, setNotificationShown] = useState<boolean>(false);

  const fetchEntradas = async () => {
    try {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        toast.error("Chave de verificação ou nome do banco não encontrados.");
        return;
      }

      const response = await fetch("/api/entradaslist", {
        method: "GET",
        headers: {
          "x-verificacao-chave": chave,
          "x-nome-banco": nomeBanco,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setEntradas(data.data);
        if (!notificationShown) {
          setNotificationShown(true);
        }
      } else {
        toast.error(data.message || "Erro ao carregar entradas.");
      }
    } catch (error) {
      console.error("Erro ao buscar entradas:", error);
      toast.error("Erro ao buscar entradas");
    }
  };

  const deleteEntrada = async (id: number) => {
    try {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        toast.error("Chave de verificação ou nome do banco não encontrados.");
        return;
      }

      const response = await fetch(`/api/entradasdelete/${id}`, {
        method: "DELETE",
        headers: {
          "x-nome-banco": nomeBanco,
          "x-verificacao-chave": chave,
        },
      });

      const data = await response.json();

      if (response.ok) {
        setEntradas((prev) => prev.filter((entrada) => entrada.id !== id));
        toast.success("Entrada excluída com sucesso!");
      } else {
        toast.error(data.message || "Erro ao excluir entrada.");
      }
    } catch (error) {
      console.error("Erro ao excluir entrada:", error);
      toast.error("Erro ao excluir entrada");
    }
  };

  const editEntrada = async () => {
    if (!observacao || !tipo || !valor || !dataLancamento) {
      toast.error("Preencha todos os campos.");
      return;
    }

    if (!editingEntrada) {
      toast.error("Entrada não encontrada para editar.");
      return;
    }

    const chave = localStorage.getItem("codigo_verificacao");
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!chave || !nomeBanco) {
      toast.error("Chave de verificação ou nome do banco não encontrados.");
      return;
    }

    const updatedEntrada = {
      id: editingEntrada.id,
      observacao,
      tipo,
      forma_pagamento: formaPagamento,
      valor,
      data_Lancamento: dataLancamento,
      membro_id: editingEntrada.membro_id,
    };

    try {
      const response = await fetch(`/api/entradasedit/${updatedEntrada.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-verificacao-chave": chave, // Envia a chave de verificação no header
          "x-nome-banco": nomeBanco, // Envia o nome do banco no header
        },
        body: JSON.stringify(updatedEntrada),
      });
      const data = await response.json();

      if (response.ok) {
        setEntradas((prev) =>
          prev.map((entrada) =>
            entrada.id === updatedEntrada.id ? updatedEntrada : entrada,
          ),
        );
        toast.success("Entrada atualizada com sucesso!");
        setIsEditing(false);
        setEditingEntrada(null);
        clearForm();
      } else {
        toast.error(data.message || "Erro ao atualizar entrada.");
      }
    } catch (error) {
      console.error("Erro ao atualizar entrada:", error);
      toast.error("Erro ao atualizar entrada");
    }
  };

  const clearForm = () => {
    setObservacao("");
    setTipo("");
    setFormaPagamento("");
    setValor("");
    setDataLancamento("");
  };

  const formatarValor = (valor: string) =>
    `R$ ${parseFloat(valor).toFixed(2).replace(".", ",")}`;

  const formatarData = (data: string | null) => {
    if (!data || data === "null") return "-"; // Exibe "-" se a data for null
    const date = new Date(data);
    if (isNaN(date.getTime())) {
      return "-"; // Se a data for inválida, exibe "-"
    }
    return date.toLocaleDateString("pt-BR"); // Formato brasileiro
  };

  const entradasFiltradas = entradas.filter((entrada) => {
    const dataVencimento = new Date(entrada.data_Lancamento);
    const startDate = startDateFilter ? new Date(startDateFilter) : null;
    const endDate = endDateFilter ? new Date(endDateFilter) : null;

    const matchesStartDate = !startDate || dataVencimento >= startDate;
    const matchesEndDate = !endDate || dataVencimento <= endDate;

    return matchesStartDate && matchesEndDate;
  });

  useEffect(() => {
    fetchEntradas();
  }, []);

  return (
    <div className="mx-auto mt-4 w-full max-w-full space-y-4 rounded-lg p-4 shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_-4px_6px_rgba(0,0,0,0.1)]">
      <h1 className="text-[1.4rem] font-bold text-gray-700">
        Resumo de Entradas
      </h1>

      <div className="mb-4 flex gap-4">
        <div className="flex gap-2">
          <input
            type="date"
            value={startDateFilter}
            onChange={(e) => setStartDateFilter(e.target.value)}
            className="rounded-md border p-2"
          />
          <input
            type="date"
            value={endDateFilter}
            onChange={(e) => setEndDateFilter(e.target.value)}
            className="rounded-md border p-2"
          />
        </div>
      </div>

      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="px-4 py-2 text-left">Observação</th>
            <th className="px-4 py-2 text-left">Tipo</th>
            <th className="px-4 py-2 text-left">Forma de Pagamento</th>
            <th className="px-4 py-2 text-left">Valor</th>
            <th className="px-4 py-2 text-left">Lançamento</th>
            <th className="px-4 py-2 text-left">Ações</th>
          </tr>
        </thead>
        <tbody>
          {entradasFiltradas.map((entrada) => (
            <tr key={entrada.id}>
              <td className="px-4 py-2">{entrada.observacao}</td>
              <td className="px-4 py-2">{entrada.tipo}</td>
              <td className="px-4 py-2">{entrada.forma_pagamento}</td>
              <td className="px-4 py-2">{formatarValor(entrada.valor)}</td>
              <td className="px-4 py-2">
                {formatarData(entrada.data_Lancamento)}{" "}
                {/* Alterado para data_Lancamento */}
              </td>

              <td className="px-4 py-2">
                <button
                  onClick={() => {
                    setEditingEntrada(entrada);
                    setIsEditing(true);
                    setObservacao(entrada.observacao);
                    setTipo(entrada.tipo);
                    setFormaPagamento(entrada.forma_pagamento);
                    setValor(entrada.valor);
                    setDataLancamento(entrada.data_Lancamento);
                    {
                      /* Alterado para data_Lancamento */
                    }
                  }}
                  className="text-blue-500 hover:text-blue-700"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteEntrada(entrada.id)}
                  className="ml-2 text-red-500 hover:text-red-700"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {isEditing && editingEntrada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="w-[40rem] rounded-md bg-white p-6 shadow-md">
            <h2 className="text-lg font-bold">Editar Entrada</h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                editEntrada();
              }}
            >
              <div className="mb-4">
                <label className="block text-gray-700">Observação</label>
                <input
                  type="text"
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  className="w-full rounded-md border p-2 text-black"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Tipo</label>
                <select
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className="w-full rounded-md border p-2 text-black"
                >
                  <option value="Dizimo">Dízimo</option>
                  <option value="Oferta">Oferta</option>
                  <option value="Doacao">Doação</option>
                  <option value="Campanha">Campanha</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">
                  Forma de Pagamento
                </label>
                <select
                  value={formaPagamento}
                  onChange={(e) => setFormaPagamento(e.target.value)}
                  className="w-full rounded-md border p-2 text-black"
                >
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="PIX">PIX</option>
                  <option value="Debito">Débito</option>
                  <option value="Credito">Crédito</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">Valor</label>
                <input
                  type="text"
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  className="w-full rounded-md border p-2 text-black"
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700">
                  Data de Lançamento
                </label>
                <input
                  type="date"
                  value={new Date(dataLancamento).toISOString().split("T")[0]} // Formato YYYY-MM-DD
                  onChange={(e) => setDataLancamento(e.target.value)}
                  className="w-full rounded-md border p-2 text-black"
                />
              </div>

              <button
                type="submit"
                className="mt-4 rounded-md bg-media px-4 py-2 text-white"
              >
                Atualizar
              </button>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="ml-2 mt-4 rounded-md bg-red-500 px-4 py-2 text-white"
              >
                Fechar
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default EntradasList;
