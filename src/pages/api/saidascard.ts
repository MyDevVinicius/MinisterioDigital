import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Certifique-se de que esse caminho está correto
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

  const chave = req.headers["x-verificacao-chave"] as string | undefined;
  const nomeBanco = req.headers["x-nome-banco"] as string | undefined;
  const mes = req.headers["x-mes"] as string | undefined;
  const ano = req.headers["x-ano"] as string | undefined;

  if (!chave || !nomeBanco) {
    return res
      .status(400)
      .json({
        message: "Chave de verificação ou nome do banco não fornecidos.",
      });
  }

  if (!mes || !ano) {
    return res
      .status(400)
      .json({ message: "Mês ou ano não fornecidos nos cabeçalhos." });
  }

  let adminConnection = null;
  let clientConnection = null;

  try {
    adminConnection = await getClientConnection("admin_db");

    const [result] = await adminConnection.query<RowDataPacket[]>(
      `SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?`,
      [chave],
    );

    if (result.length === 0) {
      return res.status(404).json({ message: "Chave inválida." });
    }

    const databaseName = result[0].nome_banco as string;

    if (databaseName !== nomeBanco) {
      return res.status(400).json({ message: "Nome do banco inválido." });
    }

    clientConnection = await getClientConnection(databaseName);

    // Consultas para obter as somas das entradas e saídas
    const [saidas] = await clientConnection.query<RowDataPacket[]>(
      `SELECT SUM(valor_pago) as total_pago FROM saida WHERE MONTH(data) = ? AND YEAR(data) = ?`,
      [mes, ano],
    );

    const [entradas] = await clientConnection.query<RowDataPacket[]>(
      `SELECT SUM(valor) as total_pago FROM entrada WHERE MONTH(data) = ? AND YEAR(data) = ?`,
      [mes, ano],
    );

    // Verificar os valores retornados
    const totalEntradas = entradas[0]?.total_pago || 0;
    const totalSaidas = saidas[0]?.total_pago || 0;

    console.log("Entradas: ", totalEntradas);
    console.log("Saídas: ", totalSaidas);

    // Calcula a diferença
    const diferenca = totalEntradas - totalSaidas;
    console.log("Diferença: ", diferenca);

    return res.status(200).json({
      totalEntradas,
      totalSaidas,
      diferenca,
    });
  } catch (error: any) {
    console.error("Erro ao buscar dados do card:", error);
    return res.status(500).json({ message: "Erro interno no servidor." });
  } finally {
    if (adminConnection) await adminConnection.release();
    if (clientConnection) await clientConnection.release();
  }
}
