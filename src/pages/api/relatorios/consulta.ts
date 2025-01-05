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

    let table = "";
    let tipoField = "";

    if (tipo === "entrada") {
      table = "entrada";
      tipoField = "tipo"; // A coluna `tipo` existe na tabela `entrada`
    } else if (tipo === "saida") {
      table = "saida";
      tipoField = "tipo"; // A coluna `tipo` existe na tabela `saida`
    } else {
      // Quando for "todos", consulta tanto `entrada` quanto `saida`
      table = "(entrada UNION ALL saida)";
      tipoField = "tipo";
    }

    // Atualizando a consulta para incluir o campo `observacao` e o nome do usuário
    let query = `
      SELECT ${tipoField}, forma_pagamento AS formaPagamento, valor, data, 
             usuario_id AS usuario, observacao, u.nome AS usuarioNome
      FROM ${table} t
      LEFT JOIN usuarios u ON t.usuario_id = u.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Filtra por subtipo (apenas na tabela `entrada` porque `saida` não tem `subtipo`)
    if (subtipo && tipo === "entrada" && subtipo !== "todos") {
      query += " AND tipo = ?";
      params.push(subtipo); // Substitui `subtipo` por valores da coluna `tipo` em `entrada`
    }

    // Filtra por forma de pagamento
    if (formaPagamento && formaPagamento !== "todos") {
      query += " AND forma_pagamento = ?";
      params.push(formaPagamento);
    }

    // Filtra por data de início
    if (dataInicio) {
      query += " AND data >= ?";
      params.push(dataInicio);
    }

    // Filtra por data final
    if (dataFinal) {
      query += " AND data <= ?";
      params.push(dataFinal);
    }

    // Filtra por id do usuário
    if (usuarioId) {
      query += " AND usuario_id = ?";
      params.push(usuarioId);
    }

    // Executa a consulta no banco
    const [rows] = await clientConnection.query(query, params);

    return res.status(200).json(rows);
  } catch (error) {
    console.error("Erro ao consultar registros:", error);
    return res.status(500).json({ message: "Erro ao consultar registros." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
