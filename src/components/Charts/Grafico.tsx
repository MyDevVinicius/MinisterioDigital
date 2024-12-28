import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
} from "chart.js";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { pt } from "date-fns/locale";

ChartJS.register(
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  BarElement,
);

const GraficoEntradasSaidas = ({ altura }: { altura: string | number }) => {
  const [dataInicial, setDataInicial] = useState<Date | null>(null);
  const [dataFinal, setDataFinal] = useState<Date | null>(null);
  const [entradas, setEntradas] = useState<{
    categorias: string[];
    valores: number[];
  } | null>(null);
  const [saidas, setSaidas] = useState<{
    categorias: string[];
    valores: number[];
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nomeBanco = localStorage.getItem("nome_banco");
  const chave = localStorage.getItem("codigo_verificacao");

  useEffect(() => {
    const savedDataInicial = localStorage.getItem("data_inicial");
    const savedDataFinal = localStorage.getItem("data_final");

    if (savedDataInicial && savedDataFinal) {
      setDataInicial(new Date(savedDataInicial));
      setDataFinal(new Date(savedDataFinal));
    }
  }, []);

  const fetchData = async () => {
    if (!dataInicial || !dataFinal) {
      setError("Selecione as datas de início e fim.");
      return;
    }

    if (!nomeBanco || !chave) {
      setError("Nome do banco ou chave de verificação não encontrados.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dataFormatadaInicial = dataInicial.toISOString().split("T")[0];
      const dataFormatadaFinal = dataFinal.toISOString().split("T")[0];

      const [entradasRes, saidasRes] = await Promise.all([
        fetch(
          `/api/entradasgrafico?dataInicial=${dataFormatadaInicial}&dataFinal=${dataFormatadaFinal}`,
          {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          },
        ),
        fetch(
          `/api/saidasgrafico?dataInicial=${dataFormatadaInicial}&dataFinal=${dataFormatadaFinal}`,
          {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          },
        ),
      ]);

      if (!entradasRes.ok || !saidasRes.ok) {
        throw new Error("Erro ao buscar dados.");
      }

      const entradasData = await entradasRes.json();
      const saidasData = await saidasRes.json();

      setEntradas(entradasData);
      setSaidas(saidasData);
    } catch (error) {
      setError("Erro ao buscar dados do gráfico.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataInicial && dataFinal) {
      fetchData();
    }
  }, [dataInicial, dataFinal]);

  useEffect(() => {
    if (dataInicial && dataFinal) {
      localStorage.setItem("data_inicial", dataInicial.toISOString());
      localStorage.setItem("data_final", dataFinal.toISOString());
    }
  }, [dataInicial, dataFinal]);

  const formatarDatas = (data: string) => {
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString("pt-BR", {
      weekday: "short",
      day: "numeric",
      month: "short",
    });
  };

  const data = {
    labels:
      entradas?.categorias?.map(formatarDatas) ||
      saidas?.categorias?.map(formatarDatas) ||
      [],
    datasets: [
      {
        label: "Entradas",
        data: entradas?.valores || [],
        backgroundColor: "rgba(75, 192, 192, 0.6)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
      },
      {
        label: "Saídas",
        data: saidas?.valores || [],
        backgroundColor: "rgba(255, 99, 132, 0.6)",
        borderColor: "rgba(255, 99, 132, 1)",
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          boxWidth: 12,
          padding: 15,
        },
      },
      tooltip: {
        enabled: true,
        mode: "index",
        intersect: false,
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: "Datas",
        },
        type: "category",
        ticks: {
          autoSkip: true,
          maxTicksLimit: 10,
        },
        grid: {
          display: false,
        },
        offset: true,
      },
      y: {
        title: {
          display: true,
          text: "Valores (R$)",
        },
        grid: {
          display: true,
        },
        ticks: {
          beginAtZero: true,
        },
      },
    },
  };

  return (
    <div
      className="mt-4 overflow-x-auto rounded-lg bg-white p-4 shadow-lg"
      style={{
        boxShadow:
          "0 -4px 6px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.1)",
      }}
    >
      <div className="mb-4">
        <h2 className="text-center text-lg font-semibold text-gray-700 sm:text-left">
          Gráfico de Entradas e Saídas
        </h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm text-gray-500">
              Data Inicial:
            </label>
            <DatePicker
              selected={dataInicial}
              onChange={(date) => setDataInicial(date)}
              className="w-full rounded-lg border p-2"
              dateFormat="yyyy-MM-dd"
              locale={pt}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-gray-500">
              Data Final:
            </label>
            <DatePicker
              selected={dataFinal}
              onChange={(date) => setDataFinal(date)}
              className="w-full rounded-lg border p-2"
              dateFormat="yyyy-MM-dd"
              locale={pt}
            />
          </div>
        </div>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
      {entradas && saidas && (
        <div className="h-auto w-full" style={{ height: altura }}>
          <Bar data={data} options={options} />
        </div>
      )}
    </div>
  );
};

export default GraficoEntradasSaidas;
