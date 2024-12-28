import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Ajuste o caminho do db.ts
import { RowDataPacket } from "mysql2";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ message: `Método ${req.method} não permitido.` });
  }

  const chave = req.headers["x-verificacao-chave"];
  const nomeBanco = req.headers["x-nome-banco"];

  if (
    !chave ||
    typeof chave !== "string" ||
    !nomeBanco ||
    typeof nomeBanco !== "string"
  ) {
    return res.status(400).json({
      message: "Chave de verificação ou nome do banco não fornecidos.",
    });
  }

  let adminConnection;
  let clientConnection;

  try {
    adminConnection = await getClientConnection("admin_db");
    const [result] = await adminConnection.query<RowDataPacket[]>(
      "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
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

    const { observacao, tipo, formaPagamento, valor, dataTransacao, membroId } =
      req.body;

    if (!observacao || !tipo || !formaPagamento || !valor || !dataTransacao) {
      return res
        .status(400)
        .json({ message: "Dados faltando no corpo da requisição." });
    }

    const query =
      "INSERT INTO entrada (observacao, tipo, forma_pagamento, valor, data, membro_id) VALUES (?, ?, ?, ?, ?, ?)";
    const queryParams = [
      observacao,
      tipo,
      formaPagamento,
      valor,
      dataTransacao,
      membroId || null,
    ];

    await clientConnection.query(query, queryParams);
    return res.status(201).json({ message: "Entrada registrada com sucesso." });
  } catch (error) {
    return res.status(500).json({ message: "Erro ao registrar entrada." });
  } finally {
    if (adminConnection) adminConnection.release();
    if (clientConnection) clientConnection.release();
  }
}
