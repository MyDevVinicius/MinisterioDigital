import React, { useEffect, useState } from "react";

interface FilterComponentProps {
  onFilterChange: (filters: {
    tipo: string;
    subtipo: string;
    formaPagamento: string;
    data: string;
    usuario: string;
    observacao: string; // Adiciona o campo 'observacao'
  }) => void;
}

const FilterComponent: React.FC<FilterComponentProps> = ({
  onFilterChange,
}) => {
  const [tipo, setTipo] = useState<string>(""); // Tipo de transação: entrada ou saída
  const [subtipo, setSubtipo] = useState<string>("todos");
  const [formaPagamento, setFormaPagamento] = useState<string>("todos");
  const [dataInicio, setDataInicio] = useState<string>("");
  const [dataFinal, setDataFinal] = useState<string>("");
  const [usuarioId, setUsuarioId] = useState<string>("");
  const [usuarios, setUsuarios] = useState<{ id: string; nome: string }[]>([]);
  const [dados, setDados] = useState<
    {
      tipo: string;
      subtipo: string;
      formaPagamento: string;
      data: string;
      usuario: string;
    }[]
  >([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Carregar lista de usuários
  useEffect(() => {
    const banco = localStorage.getItem("nome_banco");

    if (banco) {
      fetch(`/api/relatorios/usuarios?banco=${banco}`)
        .then((response) => response.json())
        .then((data) => setUsuarios(data))
        .catch((error) => console.error("Erro ao carregar usuários:", error));
    } else {
      console.error("Nome do banco não encontrado no localStorage.");
    }
  }, []);

  // Função para gerar o relatório
  const handleGerarRelatorio = async () => {
    setLoading(true);

    try {
      const banco = localStorage.getItem("nome_banco");

      if (!banco) {
        throw new Error("Nome do banco não encontrado no localStorage.");
      }

      // Construção da URL com os filtros aplicados
      const queryParams = new URLSearchParams({
        banco,
        tipo: tipo || "",
        subtipo: subtipo !== "todos" ? subtipo : "",
        formaPagamento: formaPagamento !== "todos" ? formaPagamento : "",
        dataInicio: dataInicio || "",
        dataFinal: dataFinal || "",
        usuarioId: usuarioId || "",
      });

      // Verifica e limpa valores vazios para evitar filtros desnecessários
      const cleanQueryParams = new URLSearchParams();
      queryParams.forEach((value, key) => {
        if (value) cleanQueryParams.append(key, value); // Apenas adiciona parâmetros não vazios
      });

      const response = await fetch(
        `/api/relatorios/consulta?${cleanQueryParams}`,
      );
      if (!response.ok) {
        throw new Error("Erro ao gerar relatório");
      }

      const data = await response.json();
      setDados(data);
    } catch (error) {
      console.error("Erro ao gerar relatório:", error);
      setDados([]);
    } finally {
      setLoading(false);
    }
  };

  // Função para formatar a data
  const formatarData = (data: string) => {
    const dateObj = new Date(data);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

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
            onChange={(e) => setTipo(e.target.value)}
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
              className="mb-1 block text-sm font-medium text-gray-600"
            >
              Subtipo
            </label>
            <select
              id="subtipo"
              value={subtipo}
              onChange={(e) => setSubtipo(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="todos">Todos</option>
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
            onChange={(e) => setFormaPagamento(e.target.value)}
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
            onChange={(e) => setDataInicio(e.target.value)}
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
            onChange={(e) => setDataFinal(e.target.value)}
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
            onChange={(e) => setUsuarioId(e.target.value)}
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

        <button
          onClick={handleGerarRelatorio}
          className="mt-4 w-full rounded-md bg-blue-500 py-2 text-white"
        >
          Gerar Relatório
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-md mb-4 font-semibold text-gray-700">Resultados</h3>
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-200">
              <th className="border border-gray-300 px-4 py-2">Tipo</th>
              <th className="border border-gray-300 px-4 py-2">
                Observação
              </th>{" "}
              <th className="border border-gray-300 px-4 py-2">Subtipo</th>
              {/* Nova coluna */}
              <th className="border border-gray-300 px-4 py-2">
                Forma de Pagamento
              </th>
              <th className="border border-gray-300 px-4 py-2">Data</th>
              <th className="border border-gray-300 px-4 py-2">Usuário</th>{" "}
              {/* Usuário já vai mostrar o nome */}
            </tr>
          </thead>
          <tbody>
            {dados.length > 0 ? (
              dados.map((dado, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">
                    {dado.tipo}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {dado.observacao}
                  </td>{" "}
                  {/* Exibe a observação */}
                  <td className="border border-gray-300 px-4 py-2">
                    {dado.subtipo}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {dado.formaPagamento}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatarData(dado.data)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {dado.usuarioNome}
                  </td>{" "}
                  {/* Exibe o nome do usuário */}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="border border-gray-300 px-4 py-2 text-center"
                >
                  Nenhum dado encontrado
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FilterComponent;
