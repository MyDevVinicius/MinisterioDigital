import { useEffect, useState } from "react";
import axios from "axios";
import { SlWallet } from "react-icons/sl";
import { BsArrowUpRight } from "react-icons/bs";
import { BsArrowDownLeft } from "react-icons/bs";

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
        const mes = "01"; // Exemplo de mês
        const ano = "2025"; // Exemplo de ano

        if (!nomeBanco || !chave) {
          throw new Error(
            "Nome do banco ou chave de verificação não encontrados.",
          );
        }

        // Requisição para a API saidascard
        const response = await axios.get("/api/saidascard", {
          headers: {
            "x-verificacao-chave": chave,
            "x-nome-banco": nomeBanco,
            "x-mes": mes,
            "x-ano": ano,
          },
        });

        const { totalEntradas, totalSaidas, diferenca } = response.data;

        setEntradas(totalEntradas);
        setSaidas(totalSaidas);
        setDiferenca(diferenca);
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
          diferenca === 0 ? (
            <p className="text-2xl font-bold text-blue-600">Sem diferença</p>
          ) : (
            <p className="text-2xl font-bold text-blue-600">
              R${" "}
              {diferenca.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          )
        ) : (
          <p className="text-sm text-gray-400">Carregando...</p>
        )}
      </div>
      <div className="mt-4 flex justify-between text-sm text-gray-700">
        <span className="text-green-500">
          <BsArrowUpRight size={20} />
          R${" "}
          {entradas !== null
            ? entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
            : "0,00"}
        </span>
        <span className="text-red-500">
          <BsArrowDownLeft size={20} /> R${" "}
          {saidas !== null
            ? saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })
            : "0,00"}
        </span>
      </div>
    </div>
  );
};

export default SaldoDiferencaContainer;
