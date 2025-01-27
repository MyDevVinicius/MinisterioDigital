import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Ajuste o caminho conforme necessário
import { RowDataPacket } from "mysql2";

// Função para validar parâmetros de data
const validateDate = (date: string | undefined): Date | null => {
  if (!date) return null;

  const parsedDate = new Date(date);
  return isNaN(parsedDate.getTime()) ? null : parsedDate;
};

// Função para formatar as entradas
const formatEntries = (rows: RowDataPacket[]): any[] => {
  return rows.map((row) => ({
    ...row,
    data_Lancamento: row.data_vencimento
      ? new Date(row.data_vencimento).toISOString()
      : null,
  }));
};

// Função principal para lidar com a requisição
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === "GET") {
    const chave = Array.isArray(req.headers["x-verificacao-chave"])
      ? req.headers["x-verificacao-chave"][0]
      : req.headers["x-verificacao-chave"];

    const nomeBanco = Array.isArray(req.headers["x-nome-banco"])
      ? req.headers["x-nome-banco"][0]
      : req.headers["x-nome-banco"];

    // Validação de cabeçalhos
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

      // Validando as datas de filtro
      const validatedStartDate = validateDate(startDate as string);
      const validatedEndDate = validateDate(endDate as string);

      if (validatedStartDate) {
        query += ` AND data >= ?`;
        queryParams.push(validatedStartDate);
      }

      if (validatedEndDate) {
        query += ` AND data <= ?`;
        queryParams.push(validatedEndDate);
      }

      // Executa a consulta
      const [rows] = await clientConnection.query<RowDataPacket[]>(query, queryParams);

      if (rows.length === 0) {
        return res.status(404).json({ message: "Nenhuma entrada encontrada para os parâmetros fornecidos." });
      }

      const formattedRows = formatEntries(rows);

      console.log(formattedRows); // Para verificação no console

      return res.status(200).json({ data: formattedRows });
    } catch (error) {
      console.error("Erro ao buscar entradas:", error);
      return res.status(500).json({
        message: "Erro interno no servidor. Tente novamente mais tarde.",
        error: error.message || "Erro desconhecido",
      });
    } finally {
      if (clientConnection) {
        clientConnection.release();
      }
    }
  } else {
    return res.status(405).json({ message: `Método ${req.method} não permitido.` });
  }
}
