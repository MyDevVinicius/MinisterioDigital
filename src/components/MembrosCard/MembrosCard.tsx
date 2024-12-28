import { useEffect, useState } from "react";
import axios from "axios";
import { BsPersonVcard } from "react-icons/bs";

const QuantidadeMembrosCard: React.FC = () => {
  const [quantidadeMembros, setQuantidadeMembros] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchQuantidadeMembros = async () => {
      try {
        const nomeBanco = localStorage.getItem("nome_banco");
        const chave = localStorage.getItem("codigo_verificacao");

        if (!nomeBanco || !chave) {
          throw new Error(
            "Nome do banco ou chave de verificação não encontrados no localStorage.",
          );
        }

        const response = await axios.get("/api/membros", {
          headers: {
            "x-verificacao-chave": chave,
            "x-nome-banco": nomeBanco,
          },
        });

        if (response.status === 200) {
          // Se a resposta da API for válida, definimos a quantidade de membros
          setQuantidadeMembros(response.data.quantidade || 0);
        } else {
          throw new Error("Erro ao buscar quantidade de membros.");
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message);
        // Caso haja erro, a quantidade de membros será 0
        setQuantidadeMembros(0);
      }
    };

    fetchQuantidadeMembros();
  }, []); // Executa uma vez na montagem do componente

  return (
    <div className="relative rounded-lg bg-white p-6 shadow-[0px_4px_6px_rgba(0,0,0,0.1),0px_-4px_6px_rgba(0,0,0,0.1)]">
      <h2 className="mb-3 flex items-center text-base font-semibold text-gray-700">
        <BsPersonVcard size={30} className="text-purple-500" />
        <span className="ml-2">Membros Cadastrados</span>
      </h2>
      <div className="text-center">
        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : (
          <p className="text-2xl font-bold text-purple-600">
            {quantidadeMembros}
          </p>
        )}
      </div>
    </div>
  );
};

export default QuantidadeMembrosCard;
