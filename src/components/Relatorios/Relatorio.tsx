import React, { useState } from "react";
import axios from "axios";

interface FilterOptions {
  type: string;
  category: string;
  startDate: string;
  endDate: string;
}

const ReportFilter: React.FC = () => {
  const [filter, setFilter] = useState<FilterOptions>({
    type: "entrada",
    category: "",
    startDate: "",
    endDate: "",
  });
  const [reports, setReports] = useState<any[]>([]);

  const handleFilterChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>,
  ) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };

  const fetchReports = async () => {
    try {
      const response = await axios.post("/api/relatorio", filter);
      setReports(response.data);
    } catch (error) {
      console.error("Erro ao buscar relatórios:", error);
    }
  };

  const downloadPDF = () => {
    // Função de download de PDF
    console.log("Baixar PDF");
  };

  return (
    <div className="report-filter">
      <div className="filter-container">
        <h2>Filtros para Relatórios</h2>

        <label>Tipo de Relatório</label>
        <select name="type" value={filter.type} onChange={handleFilterChange}>
          <option value="entrada">Relatório de Entrada</option>
          <option value="saida">Relatório de Saída</option>
        </select>

        {filter.type === "entrada" && (
          <>
            <label>Categoria</label>
            <select
              name="category"
              value={filter.category}
              onChange={handleFilterChange}
            >
              <option value="">Selecione</option>
              <option value="dizimos">Dízimos</option>
              <option value="ofertas">Ofertas</option>
              <option value="campanha">Campanha</option>
            </select>
          </>
        )}

        {filter.type === "saida" && (
          <>
            <label>Categoria</label>
            <select
              name="category"
              value={filter.category}
              onChange={handleFilterChange}
            >
              <option value="">Selecione</option>
              <option value="pagamentos">Pagamentos</option>
              <option value="salario">Salário</option>
              <option value="ajuda_de_custo">Ajuda de Custo</option>
            </select>
          </>
        )}

        <label>Data de Início</label>
        <input
          type="date"
          name="startDate"
          value={filter.startDate}
          onChange={handleFilterChange}
        />

        <label>Data de Fim</label>
        <input
          type="date"
          name="endDate"
          value={filter.endDate}
          onChange={handleFilterChange}
        />

        <button onClick={fetchReports}>Gerar Lista</button>
        <button onClick={downloadPDF}>Baixar PDF</button>
      </div>

      <div className="report-list">
        <h3>Resultados</h3>
        <ul>
          {reports.map((report, index) => (
            <li key={index}>{JSON.stringify(report)}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default ReportFilter;
