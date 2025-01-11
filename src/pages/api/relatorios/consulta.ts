import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    banco,
    tipo,
    subtipo,
    formaPagamento,
    dataInicio,
    dataFinal,
    usuarioId,
  } = req.query;

  if (!banco || typeof banco !== "string") {
    return res.status(400).json({ message: "Banco de dados não fornecido." });
  }

  let clientConnection;

  try {
    clientConnection = await getClientConnection(banco);

    // Definição inicial da consulta
    let query = `
  SELECT 
    t.tipo,
    t.forma_pagamento AS formaPagamento,
    t.valor AS valor, 
    t.data,
    t.usuario_id AS usuario,
    t.observacao,
    u.nome AS usuarioNome
  FROM (
    SELECT 'entrada' AS tipo, forma_pagamento, valor, data, usuario_id, observacao
    FROM entrada
    UNION ALL
    SELECT 'saida' AS tipo, forma_pagamento, valor_pago AS valor_pago, data, usuario_id, observacao
    FROM saida
  ) t
  LEFT JOIN usuarios u ON t.usuario_id = u.id
  WHERE 1=1
`;

    const params: any[] = [];

    // Filtros dinâmicos
    if (tipo) {
      query += " AND t.tipo = ?";
      params.push(tipo);
    }

    if (subtipo && tipo === "entrada" && subtipo !== "todos") {
      query += " AND t.tipo = 'entrada' AND t.observacao = ?";
      params.push(subtipo);
    }

    if (formaPagamento && formaPagamento !== "todos") {
      query += " AND t.forma_pagamento = ?";
      params.push(formaPagamento);
    }

    if (dataInicio) {
      query += " AND t.data >= ?";
      params.push(dataInicio);
    }

    if (dataFinal) {
      query += " AND t.data <= ?";
      params.push(dataFinal);
    }

    if (usuarioId) {
      query += " AND t.usuario_id = ?";
      params.push(usuarioId);
    }

    // Executar consulta
    const [rows] = await clientConnection.query(query, params);
    return res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao consultar registros:", error);
    return res.status(500).json({ message: "Erro ao consultar registros." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
