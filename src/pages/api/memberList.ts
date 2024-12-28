import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Ajuste o caminho para o db.ts
import { RowDataPacket } from "mysql2";

// Definindo a tipagem dos membros
interface MembrosCount extends RowDataPacket {
  id: number;
  nome: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ message: `Método ${req.method} não permitido.` });
  }

  // Extraindo os cabeçalhos da requisição
  const chave = req.headers["x-verificacao-chave"] as string | undefined;
  const nomeBanco = req.headers["x-nome-banco"] as string | undefined;

  if (!chave || !nomeBanco) {
    return res.status(400).json({
      message: "Chave de verificação ou nome do banco não fornecidos.",
    });
  }

  let adminConnection;
  let clientConnection;

  try {
    // Conectar ao banco admin_db para verificar a chave
    adminConnection = await getClientConnection("admin_db");

    const [result] = await adminConnection.query<RowDataPacket[]>(
      "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
      [chave],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Chave inválida." });
    }

    const databaseName = result[0].nome_banco as string;

    // Conectar ao banco do cliente
    clientConnection = await getClientConnection(databaseName);

    // Consulta para buscar membros
    const [membros] = await clientConnection.query<MembrosCount[]>(
      "SELECT id, nome FROM membros",
    );

    // Retorna os membros
    return res.status(200).json({ membros });
  } catch (error) {
    console.error("Erro ao buscar membros:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  } finally {
    if (adminConnection) adminConnection.release();
    if (clientConnection) clientConnection.release();
  }
}
