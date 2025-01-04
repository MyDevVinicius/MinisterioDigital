import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para conectar ao banco de dados do cliente
import { RowDataPacket } from "mysql2";

interface Usuario extends RowDataPacket {
  email: string;
  nome: string;
  cargo: string;
  id: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  const email = req.headers["x-usuario-email"] as string;

  if (!email) {
    return res.status(400).json({ error: "E-mail não fornecido no cabeçalho" });
  }

  const { observacao, tipo, formaPagamento, valor, dataTransacao, membroId } =
    req.body;
  const nome_banco = req.headers["x-nome-banco"] as string;

  if (
    !nome_banco ||
    !observacao ||
    !tipo ||
    !formaPagamento ||
    !valor ||
    !dataTransacao
  ) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  let clientConnection;
  let usuarioId;

  try {
    clientConnection = await getClientConnection(nome_banco);
    const userSql = "SELECT id FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [
      email,
    ]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    usuarioId = userRows[0].id;

    const queryParams = [
      observacao,
      tipo,
      formaPagamento,
      valor,
      dataTransacao,
      usuarioId,
      tipo === "Dizimo" || tipo === "Campanha" ? membroId || null : null,
    ];

    const query =
      "INSERT INTO entrada (observacao, tipo, forma_pagamento, valor, data, usuario_id, membro_id) VALUES (?, ?, ?, ?, ?, ?, ?)";

    await clientConnection.query(query, queryParams);

    return res.status(201).json({ message: "Entrada registrada com sucesso." });
  } catch (error) {
    console.error("Erro ao registrar entrada:", error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  } finally {
    if (clientConnection) clientConnection.end();
  }
}
