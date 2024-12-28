import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Certifique-se de ajustar o caminho do db.ts
import { RowDataPacket } from "mysql2";

interface MembrosCount extends RowDataPacket {
  quantidade: number;
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
    // Conecta ao banco admin_db para verificar a chave de verificação
    adminConnection = await getClientConnection("admin_db");

    // Verifica o nome do banco associado à chave
    const [result] = await adminConnection.query<RowDataPacket[]>(
      "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
      [chave],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Chave inválida." });
    }

    const databaseName = result[0].nome_banco as string;

    // Conecta ao banco do cliente usando o nome do banco obtido
    clientConnection = await getClientConnection(databaseName);

    // Consulta para contar os membros na tabela 'membros'
    const [rows] = await clientConnection.query<MembrosCount[]>(
      "SELECT COUNT(*) AS quantidade FROM membros",
    );

    // Garante que 'rows' seja tratado corretamente
    const quantidade = rows.length > 0 ? rows[0].quantidade : 0;

    // Retorna a quantidade de membros
    return res.status(200).json({ quantidade });
  } catch (error: any) {
    console.error("Erro ao buscar quantidade de membros:", error);
    return res.status(500).json({
      message: "Erro interno no servidor.",
    });
  } finally {
    if (adminConnection) adminConnection.release();
    if (clientConnection) clientConnection.release();
  }
}
