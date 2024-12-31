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
    // Verificar chave de verificação e nome do banco
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

    // Conexão com o banco do cliente
    clientConnection = await getClientConnection(databaseName);

    const {
      observacao,
      tipo,
      formaPagamento,
      valor,
      dataTransacao,
      valorPago,
      dataVencimento,
    } = req.body;

    if (
      !observacao ||
      !tipo ||
      !formaPagamento ||
      !valor ||
      !dataTransacao ||
      !valorPago ||
      !dataVencimento
    ) {
      return res
        .status(400)
        .json({ message: "Dados faltando no corpo da requisição." });
    }

    // Determinar o status
    let status = "Pendente";
    if (
      valorPago > 0 &&
      valorPago < valor &&
      new Date(dataVencimento) < new Date()
    ) {
      status = "Vencida";
    } else if (valorPago === valor) {
      status = "Pago";
    } else if (valorPago > 0 && valorPago < valor) {
      status = "Pago Parcial";
    }

    // Inserir na tabela contas_a_pagar e obter o ID gerado
    const queryContasAPagar =
      "INSERT INTO contas_a_pagar (observacao, valor, data_vencimento, status, valor_pago) VALUES (?, ?, ?, ?, ?)";
    const queryParamsContasAPagar = [
      observacao,
      valor,
      dataVencimento,
      status,
      valorPago,
    ];

    const [insertResult] = await clientConnection.query(
      queryContasAPagar,
      queryParamsContasAPagar,
    );
    const contaId = (insertResult as any).insertId; // Obtém o ID gerado

    // Inserir na tabela saida com o conta_id
    const querySaida =
      "INSERT INTO saida (observacao, tipo, forma_pagamento, valor, data, conta_id) VALUES (?, ?, ?, ?, ?, ?)";
    const queryParamsSaida = [
      observacao,
      tipo,
      formaPagamento,
      valorPago, // Usar valorPago aqui
      dataTransacao,
      contaId, // Relaciona com a conta inserida
    ];

    await clientConnection.query(querySaida, queryParamsSaida);

    return res.status(201).json({
      message: "Saída e conta registradas com sucesso.",
      contaId,
    });
  } catch (error: unknown) {
    console.error("Erro ao registrar saída:", error);
    return res.status(500).json({
      message: "Erro ao registrar saída.",
      error: (error as Error).message,
    });
  } finally {
    if (adminConnection) adminConnection.release();
    if (clientConnection) clientConnection.release();
  }
}
