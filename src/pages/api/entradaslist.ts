import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Ajuste o caminho conforme necessário
import { RowDataPacket } from "mysql2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "GET") {
    const chave = Array.isArray(req.headers["x-verificacao-chave"])
      ? req.headers["x-verificacao-chave"][0]
      : req.headers["x-verificacao-chave"];

    const nomeBanco = Array.isArray(req.headers["x-nome-banco"])
      ? req.headers["x-nome-banco"][0]
      : req.headers["x-nome-banco"];

    if (!chave || !nomeBanco) {
      return res.status(400).json({
        message: "Chave de verificação ou nome do banco não fornecidos.",
      });
    }

    let clientConnection;

    try {
      clientConnection = await getClientConnection(nomeBanco);

      const { startDate, endDate } = req.query;

      let query = `
        SELECT id, observacao, tipo, forma_pagamento, valor, data AS data_vencimento, membro_id
        FROM entrada
        WHERE 1=1
      `;

      const queryParams: any[] = [];

      if (startDate) {
        query += ` AND data >= ?`;
        queryParams.push(new Date(startDate as string));
      }

      if (endDate) {
        query += ` AND data <= ?`;
        queryParams.push(new Date(endDate as string));
      }

      const [rows] = await clientConnection.query<RowDataPacket[]>(
        query,
        queryParams,
      );

      const formattedRows = rows.map((row) => ({
        ...row,
        data_Lancamento: row.data_vencimento // Renomeie para data_Lancamento
          ? new Date(row.data_vencimento).toISOString() // Converte para ISO 8601
          : null, // Caso a data seja null
      }));

      console.log(formattedRows); // Para verificar o formato

      return res.status(200).json({ data: formattedRows });
    } catch (error) {
      console.error("Erro ao buscar entradas:", error);
      return res.status(500).json({ message: "Erro interno no servidor." });
    } finally {
      if (clientConnection) clientConnection.release();
    }
  } else {
    return res
      .status(405)
      .json({ message: `Método ${req.method} não permitido.` });
  }
}
