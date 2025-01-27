import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Certifique-se de ajustar o caminho do db.ts
import { RowDataPacket } from "mysql2";

// Função para verificar se a chave de verificação é válida
const verifyVerificationKey = async (chave: string) => {
  const adminConnection = await getClientConnection("admin_db");
  const [result] = await adminConnection.query<RowDataPacket[]>(
    "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
    [chave]
  );
  adminConnection.release();
  return result;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se o método da requisição é GET
  if (req.method !== "GET") {
    return res.status(405).json({ message: `Método ${req.method} não permitido.` });
  }

  // Recuperar cabeçalhos para a chave de verificação e nome do banco
  const chave = req.headers["x-verificacao-chave"];
  const nomeBanco = req.headers["x-nome-banco"];

  if (!chave || typeof chave !== "string" || !nomeBanco || typeof nomeBanco !== "string") {
    return res.status(400).json({
      message: "Chave de verificação ou nome do banco não fornecidos ou inválidos.",
    });
  }

  let clientConnection;

  try {
    // Verificar a chave de verificação e obter o nome do banco
    const [result] = await verifyVerificationKey(chave);

    // Se a chave de verificação não for válida
    if (!result || result.length === 0) {
      return res.status(404).json({ message: "Chave de verificação inválida." });
    }

    const databaseName = result[0].nome_banco as string;

    // Verificar se o nome do banco corresponde ao esperado
    if (databaseName !== nomeBanco) {
      return res.status(400).json({ message: "Nome do banco inválido." });
    }

    // Conectar ao banco de dados do cliente usando o nome do banco obtido
    clientConnection = await getClientConnection(databaseName);

    // Consulta para buscar entradas (ajuste conforme necessário)
    const [rows] = await clientConnection.query<RowDataPacket[]>(
      "SELECT * FROM entrada" // Substitua pela consulta real para entradas
    );

    // Retorna os dados de entradas
    return res.status(200).json(rows);

  } catch (error: any) {
    console.error("Erro ao buscar entradas:", error);
    return res.status(500).json({
      message: "Erro interno no servidor.",
      details: error.message || "Erro desconhecido",
    });
  } finally {
    // Garantir que a conexão com o banco seja liberada
    if (clientConnection) {
      try {
        clientConnection.release();
      } catch (releaseError) {
        console.error("Erro ao liberar a conexão com o banco:", releaseError);
      }
    }
  }
}
