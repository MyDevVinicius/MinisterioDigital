import { useEffect, useState } from "react";
import axios from "axios";
import { SlWallet } from "react-icons/sl";
import { BsArrowUpRight } from "react-icons/bs";
import { BsArrowDownLeft } from "react-icons/bs";

interface EntradasSaidasData {
  valor: string;
}

const SaldoDiferencaContainer: React.FC = () => {
  const [entradas, setEntradas] = useState<number | null>(null);
  const [saidas, setSaidas] = useState<number | null>(null);
  const [diferenca, setDiferenca] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDados = async () => {
      try {
        const nomeBanco = localStorage.getItem("nome_banco");
        const chave = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chave) {
          throw new Error(
            "Nome do banco ou chave de verificação não encontrados no localStorage.",
          );
        }

        // Buscar entradas e saídas simultaneamente
        const [entradasResponse, saidasResponse] = await Promise.all([
          axios.get<EntradasSaidasData[]>("/api/entradas", {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          }),
          axios.get<EntradasSaidasData[]>("/api/saidas", {
            headers: {
              "x-verificacao-chave": chave,
              "x-nome-banco": nomeBanco,
            },
          }),
        ]);

        if (entradasResponse.status !== 200 || saidasResponse.status !== 200) {
          throw new Error("Erro ao buscar entradas ou saídas.");
        }

        const entradasData = entradasResponse.data;
        const saidasData = saidasResponse.data;

        // Soma as entradas
        const totalEntradas = entradasData.reduce((acc, entrada) => {
          const valorNumerico = parseFloat(
            entrada.valor.replace(/[^\d.-]/g, ""),
          );
          return acc + valorNumerico;
        }, 0);

        // Soma as saídas
        const totalSaidas = saidasData.reduce((acc, saida) => {
          const valorNumerico = parseFloat(saida.valor.replace(/[^\d.-]/g, ""));
          return acc + valorNumerico;
        }, 0);

        // Calcula a diferença entre entradas e saídas
        const diferencaCalculada = totalEntradas - totalSaidas;

        setEntradas(totalEntradas);
        setSaidas(totalSaidas);
        setDiferenca(diferencaCalculada);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchDados();
  }, []);

  return (
    <div className="relative rounded-lg bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_-4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="mb-3 flex items-center text-base font-semibold text-gray-700">
        <SlWallet size={30} className="text-blue-500" />
        <span className="ml-2">Saldo Atual</span>
      </h2>
      <div className="text-center">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : diferenca !== null ? (
          <p className="text-2xl font-bold text-blue-600">
            R$ {diferenca.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        ) : (
          <p className="text-sm text-gray-400">Carregando...</p>
        )}
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-700">
        <span className="text-green-500">
          <BsArrowUpRight size={20} />
          R$ {entradas?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
        <span className="text-red-500">
          <BsArrowDownLeft size={20} /> R${" "}
          {saidas?.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </span>
      </div>
    </div>
  );
};

export default SaldoDiferencaContainer;
