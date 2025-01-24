import React, { useEffect, useState } from "react";
import { FaEdit, FaTrash } from "react-icons/fa";
import { toast } from "react-toastify";

interface Entrada {
  id: number;
  observacao: string;
  tipo: string;
  forma_pagamento: string;
  valor: string;
  data_Lancamento: string;
  membro_id: number;
  visibilidade: number;
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
  const [hasPermissions, setHasPermissions] = useState<boolean>(false); // Estado para controlar permissões

  const fetchEntradas = async () => {
    try {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        return; // Não precisa dar erro aqui, apenas retorna
      }

      // Verificando permissões antes de carregar entradas
      const email = localStorage.getItem("email");
      if (!email) {
        return; // Não precisa dar erro aqui, apenas retorna
      }

      const response = await fetch(
        `/api/checkPermissions?email=${email}&nomeBanco=${nomeBanco}`,
      );
      const permissionData = await response.json();

      if (
        response.ok &&
        permissionData.permissoes.some(
          (perm: any) =>
            perm.nome_pagina === "Financeiro" &&
            perm.nome_funcao === "Entradas" &&
            perm.ativado === 1,
        )
      ) {
        setHasPermissions(true);
      } else {
        setHasPermissions(false); // Definindo para false, ocultando o componente
        return; // Se não tiver permissão, retorna sem carregar as entradas
      }

      // Agora que o usuário tem permissão, buscamos as entradas
      const responseEntradas = await fetch("/api/entradaslist", {
        method: "GET",
        headers: {
          "x-verificacao-chave": chave,
          "x-nome-banco": nomeBanco,
        },
      });
      const data = await responseEntradas.json();

      if (responseEntradas.ok) {
        setEntradas(data.data);
        if (!notificationShown) {
          setNotificationShown(true);
        }
      } else {
        toast.error(data.message || "Erro ao carregar entradas.");
      }
    } catch (error) {
      console.error("Erro ao buscar entradas:", error);
    }
  };

  useEffect(() => {
    fetchEntradas();
  }, []);

  // Se o usuário não tem permissão, o componente não renderiza nada
  if (!hasPermissions) {
    return null;
  }

  const deleteEntrada = async (id: number) => {
    try {
      const chave = localStorage.getItem("codigo_verificacao");
      const nomeBanco = localStorage.getItem("nome_banco");

      if (!chave || !nomeBanco) {
        return; // Não precisa dar erro aqui, apenas retorna
      }

      const response = await fetch(`/api/entradas/${id}`, {
        method: "DELETE",
        headers: {
          "x-verificacao-chave": chave,
          "x-nome-banco": nomeBanco,
        },
      });
      const data = await response.json();

      if (response.ok) {
        setEntradas(entradas.filter((entrada) => entrada.id !== id));
        toast.success("Entrada excluída com sucesso.");
      } else {
        toast.error(data.message || "Erro ao excluir entrada.");
      }
    } catch (error) {
      console.error("Erro ao excluir entrada:", error);
      toast.error("Erro ao excluir entrada.");
    }
  };

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

      <table className="mt-4 w-full table-auto border-collapse overflow-hidden rounded-lg text-gray-700">
        <thead className="rounded-t-lg bg-gray-100">
          <tr>
            <th className="border px-4 py-2 text-left">Observação</th>
            <th className="border px-4 py-2 text-center">Tipo</th>
            <th className="border px-4 py-2 text-center">Forma de Pagamento</th>
            <th className="border px-4 py-2 text-center">Valor</th>
            <th className="border px-4 py-2 text-center">Lançamento</th>
            <th className="border px-4 py-2 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="bg-gray-50 font-bold text-black shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_-4px_6px_rgba(0,0,0,0.1)]">
          {entradas.map((entrada) => (
            <tr key={entrada.id}>
              <td className="px-4 py-2">{entrada.observacao}</td>
              <td className="px-4 py-2">{entrada.tipo}</td>
              <td className="px-4 py-2">{entrada.forma_pagamento}</td>
              <td className="px-4 py-2">{entrada.valor}</td>
              <td className="px-4 py-2">{entrada.data_Lancamento}</td>

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
                  }}
                  className="mr-[1rem] text-2xl text-media"
                >
                  <FaEdit />
                </button>
                <button
                  onClick={() => deleteEntrada(entrada.id)}
                  className="ml-2 text-red-500"
                >
                  <FaTrash />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EntradasList;
