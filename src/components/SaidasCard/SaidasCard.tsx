import { useEffect, useState } from "react";
import axios from "axios";
import { BsArrowDownLeft } from "react-icons/bs";

interface SaidasData {
  valor_pago: string; // Alterado de "valor" para "valor_pago"
  data: string; // Supondo que a data das saídas esteja nesse formato
}

const SaidasContainer: React.FC = () => {
  const [saidas, setSaidas] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Função para obter o mês e ano atuais
  const getMesAnoAtual = () => {
    const hoje = new Date();
    const mes = hoje.getMonth() + 1; // Mês atual (0-indexed, então somamos 1)
    const ano = hoje.getFullYear();
    return { mes, ano };
  };

  useEffect(() => {
    const fetchSaidas = async () => {
      try {
        // Obtém o nome do banco e a chave do localStorage
        const nomeBanco = localStorage.getItem("nome_banco");
        const chave = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chave) {
          throw new Error(
            "Nome do banco ou chave de verificação não encontrados no localStorage.",
          );
        }

        // Obtém o mês e ano atuais
        const { mes, ano } = getMesAnoAtual();

        // Requisição para a API com os parâmetros de mês e ano
        const response = await axios.get<SaidasData[]>("/api/saidas", {
          headers: {
            "x-verificacao-chave": chave,
            "x-nome-banco": nomeBanco,
            "x-mes": mes.toString(), // Mês atual
            "x-ano": ano.toString(), // Ano atual
          },
        });

        if (response.status !== 200) {
          throw new Error(response.data.message || "Erro ao buscar saídas.");
        }

        const data = response.data;
        console.log("Dados de saídas recebidos:", data);

        // Soma os valores das saídas
        const total = data.reduce((acc, saida) => {
          // Converte cada valor para número, removendo qualquer caractere indesejado como "R$"
          const valorNumerico = parseFloat(
            saida.valor_pago.replace(/[^\d.-]/g, ""),
          );
          return acc + valorNumerico;
        }, 0);

        setSaidas(total);
      } catch (err: any) {
        console.error(err);
        setError(err.message);
      }
    };

    fetchSaidas();
  }, []); // O array de dependências vazio faz com que o fetch seja executado apenas uma vez

  return (
    <div className="relative rounded-lg bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_-4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="mb-4 flex items-center text-base font-semibold text-gray-700">
        <BsArrowDownLeft size={30} className="text-red-500" />
        <span className="ml-2">Saídas</span>
      </h2>
      <div className="text-center">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : saidas !== null ? (
          <p className="text-2xl font-bold text-red-600">
            R$ {saidas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        ) : (
          <p className="text-sm text-gray-400">Carregando...</p>
        )}
      </div>
    </div>
  );
};

export default SaidasContainer;
