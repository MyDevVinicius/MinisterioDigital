import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Certifique-se de ajustar o caminho do db.ts
import { RowDataPacket } from "mysql2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ message: `Método ${req.method} não permitido.` });
  }

  // Recupera os cabeçalhos para a chave de verificação, nome do banco, mês e ano
  const chave = req.headers["x-verificacao-chave"] as string | undefined;
  const nomeBanco = req.headers["x-nome-banco"] as string | undefined;
  const mes = req.headers["x-mes"] as string | undefined;
  const ano = req.headers["x-ano"] as string | undefined;

  if (!chave || !nomeBanco) {
    return res.status(400).json({
      message: "Chave de verificação ou nome do banco não fornecidos.",
    });
  }

  if (!mes || !ano) {
    return res.status(400).json({
      message: "Mês ou ano não fornecidos nos cabeçalhos.",
    });
  }

  let adminConnection = null;
  let clientConnection = null;

  try {
    // Conecta ao banco admin_db para verificar a chave de verificação
    adminConnection = await getClientConnection("admin_db");

    // Verifica o nome do banco associado à chave
    const [result] = await adminConnection.query<RowDataPacket[]>(
      `
      SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?
    `,
      [chave],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Chave inválida." });
    }

    const databaseName = result[0].nome_banco as string;

    // Se o nome do banco passado na requisição não corresponder ao nome do banco verificado
    if (databaseName !== nomeBanco) {
      return res.status(400).json({ message: "Nome do banco inválido." });
    }

    // Conecta ao banco do cliente usando o nome do banco obtido
    clientConnection = await getClientConnection(databaseName);

    // Consulta para buscar valores pagos com base no mês e ano
    const query = `
      SELECT valor_pago, data 
      FROM saida 
      WHERE MONTH(data) = ? AND YEAR(data) = ?
    `;
    const [rows] = await clientConnection.query<RowDataPacket[]>(query, [
      mes,
      ano,
    ]);

    // Retorna os dados filtrados
    return res.status(200).json(rows);
  } catch (error: any) {
    console.error("Erro ao buscar Saídas:", error);
    return res.status(500).json({
      message: "Erro interno no servidor.",
    });
  } finally {
    if (adminConnection) {
      try {
        await adminConnection.release();
      } catch (releaseError) {
        console.error(
          "Erro ao liberar a conexão administrativa:",
          releaseError,
        );
      }
    }

    if (clientConnection) {
      try {
        await clientConnection.release();
      } catch (releaseError) {
        console.error("Erro ao liberar a conexão do cliente:", releaseError);
      }
    }
  }
}
