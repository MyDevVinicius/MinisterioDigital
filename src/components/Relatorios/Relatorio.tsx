import React, { useEffect, useState } from "react";
import jsPDF from "jspdf";
import "jspdf-autotable";

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
      observacao: string;
      tipo: string;
      valor: string;
      formaPagamento: string;
      data: string;
      usuarioNome: string;
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

  // Função para exportar os dados para um PDF
  const handleExportarPDF = async () => {
    const doc = new jsPDF();
    const titulo = "Relatório";
    const dataAtual = new Date().toLocaleDateString();
    const horaAtual = new Date().toLocaleTimeString();

    // Obter informações do usuário
    const email = localStorage.getItem("email");
    const nomeBanco = localStorage.getItem("nome_banco");

    if (!email || !nomeBanco) {
      console.log("Email ou nome do banco não encontrado no localStorage.");
      return;
    }

    let usuario = null;
    try {
      const response = await fetch(
        `/api/usuarios?email=${email}&nome_banco=${nomeBanco}`,
      );
      if (!response.ok) throw new Error("Erro ao buscar dados do usuário.");
      usuario = await response.json();
    } catch (error) {
      console.error(error.message);
      console.log("Erro ao buscar informações do usuário.");
      return;
    }

    if (!usuario) {
      console.log("Usuário não encontrado.");
      return;
    }

    // Configurações de fonte
    const fontePadrao = "helvetica";
    const tamanhoFonteTitulo = 14;
    const tamanhoFonteTexto = 10;
    const margemEsquerda = 14;

    // Carregar a logo como base64
    const logoBase64 = await fetch("/logosoft.png")
      .then((res) => res.blob())
      .then((blob) => {
        return new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject("Erro ao carregar imagem.");
          reader.readAsDataURL(blob);
        });
      });

    // Adicionar logo
    const logoWidth = 40; // Largura da logo
    const logoHeight = 18; // Altura da logo
    const logoX = margemEsquerda; // Posição X
    const logoY = 10; // Posição Y
    doc.addImage(logoBase64, "PNG", logoX, logoY, logoWidth, logoHeight);

    // Adicionar data, hora e informações do usuário
    doc.setFont(fontePadrao, "normal");
    doc.setFontSize(tamanhoFonteTexto);
    const textoDataHora = `Data: ${dataAtual}  |  Hora: ${horaAtual}`;
    const margemDireita = doc.internal.pageSize.width - margemEsquerda;
    doc.text(textoDataHora, margemDireita, 20, { align: "right" });

    const textoUsuario = `${usuario.nome} - ${usuario.cargo}`;
    doc.text(textoUsuario, margemDireita, 25, { align: "right" });

    // Adicionar título
    doc.setFontSize(tamanhoFonteTitulo);
    doc.setFont(fontePadrao, "bold");
    doc.text(titulo, margemEsquerda, logoY + logoHeight + 10);

    // Configuração da tabela
    const tableColumn = [
      "Observação",
      "Tipo",
      "Valor",
      "Forma de Pagamento",
      "Data de Lançamento",
      "Lançamento Feito Por",
    ];
    const tableRows: string[][] = [];

    dados.forEach((item) => {
      const row = [
        item.observacao,
        item.tipo,
        item.valor,
        item.formaPagamento,
        formatarData(item.data),
        item.usuarioNome,
      ];
      tableRows.push(row);
    });

    // Adicionar tabela
    doc.autoTable({
      head: [tableColumn],
      body: tableRows,
      startY: logoY + logoHeight + 20,
      styles: {
        halign: "center", // Centralizar texto nas células
        valign: "middle", // Centralizar verticalmente
        fontSize: tamanhoFonteTexto,
      },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { cellWidth: "auto" },
        2: { cellWidth: "auto" },
        3: { cellWidth: "auto" },
        4: { cellWidth: "auto" },
        5: { cellWidth: "auto" },
      },
      tableWidth: "wrap", // Ajusta a tabela para ocupar a largura da página
    });

    // Salvar o arquivo PDF
    doc.save("Relatorio.pdf");
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
      </div>

      <div className="mt-6 flex justify-end space-x-4">
        <button
          onClick={handleGerarRelatorio}
          className="rounded-lg bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          {loading ? "Carregando..." : "Gerar Relatório"}
        </button>
        <button
          onClick={handleExportarPDF}
          className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600"
        >
          Exportar PDF
        </button>
      </div>

      <div className="mt-6">
        <h3 className="mb-4 text-lg font-semibold text-gray-700">Resultados</h3>
        {dados.length === 0 ? (
          <p>Nenhum dado encontrado.</p>
        ) : (
          <table className="w-full table-auto border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="border border-gray-300 px-4 py-2">Observação</th>
                <th className="border border-gray-300 px-4 py-2">Tipo</th>
                <th className="border border-gray-300 px-4 py-2">Valor</th>
                <th className="border border-gray-300 px-4 py-2">
                  Forma de Pagamento
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  Data de Lançamento
                </th>
                <th className="border border-gray-300 px-4 py-2">
                  Lançado por
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.map((item, index) => (
                <tr key={index}>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.observacao}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.tipo}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.valor}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.formaPagamento}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {formatarData(item.data)}
                  </td>
                  <td className="border border-gray-300 px-4 py-2">
                    {item.usuarioNome}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default FilterComponent;
