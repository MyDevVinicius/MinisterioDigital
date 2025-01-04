import React, { useEffect, useState } from "react";

interface FilterComponentProps {
  onFilterChange: (filters: {
    tipo?: string;
    subtipo?: string;
    formaPagamento?: string;
    dataInicio?: string;
    dataFinal?: string;
    usuarioId?: string;
  }) => void;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  onFilterChange,
}) => {
  const [tipo, setTipo] = useState<string | undefined>();
  const [subtipo, setSubtipo] = useState<string | undefined>();
  const [formaPagamento, setFormaPagamento] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState<string | undefined>();
  const [dataFinal, setDataFinal] = useState<string | undefined>();
  const [usuarioId, setUsuarioId] = useState<string | undefined>();
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);

  return (
    <div className="rounded-lg bg-gray-100 p-6 shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-gray-700">Filtros</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {/* Tipo */}
        <div>
          <label
            htmlFor="tipo"
            className="mb-1 block text-sm font-medium text-gray-600"
          >
            Tipo
          </label>
          <select
            id="tipo"
            value={tipo}
            onChange={(e) => setTipo(e.target.value || undefined)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>

        {/* Subtipo */}
        {tipo && (
          <div>
            <label
              htmlFor="subtipo"
              className="mb-1 flex text-sm font-medium text-gray-600"
            >
              Subtipo
            </label>
            <select
              id="subtipo"
              value={subtipo}
              onChange={(e) => setSubtipo(e.target.value || undefined)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              {tipo === "entrada" && (
                <>
                  <option value="Dizimo">Dízimo</option>
                  <option value="Oferta">Oferta</option>
                  <option value="Doacao">Doação</option>
                  <option value="Campanha">Campanha</option>
                </>
              )}
              {tipo === "saida" && (
                <>
                  <option value="Pagamento">Pagamento</option>
                  <option value="Salario">Salário</option>
                  <option value="Ajuda de Custo">Ajuda de Custo</option>
                </>
              )}
            </select>
          </div>
        )}

        {/* Forma de Pagamento */}
        <div>
          <label
            htmlFor="formaPagamento"
            className="mb-1 block text-sm font-medium text-gray-600"
          >
            Forma de Pagamento
          </label>
          <select
            id="formaPagamento"
            value={formaPagamento}
            onChange={(e) => setFormaPagamento(e.target.value || undefined)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="todos">Todos</option>
            <option value="dinheiro">Dinheiro</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>
        </div>

        {/* Data Início */}
        <div>
          <label
            htmlFor="dataInicio"
            className="mb-1 block text-sm font-medium text-gray-600"
          >
            Data Início
          </label>
          <input
            id="dataInicio"
            type="date"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value || undefined)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Data Final */}
        <div>
          <label
            htmlFor="dataFinal"
            className="mb-1 block text-sm font-medium text-gray-600"
          >
            Data Final
          </label>
          <input
            id="dataFinal"
            type="date"
            value={dataFinal}
            onChange={(e) => setDataFinal(e.target.value || undefined)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        {/* Usuário */}
        <div>
          <label
            htmlFor="usuarioId"
            className="mb-1 block text-sm font-medium text-gray-600"
          >
            Usuário
          </label>
          <select
            id="usuarioId"
            value={usuarioId}
            onChange={(e) => setUsuarioId(e.target.value || undefined)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
          >
            <option value="">Todos</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nome}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

export default FilterComponent;
