import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para conectar ao banco de dados do cliente
import { RowDataPacket } from "mysql2";

// Tipagem para o usuário
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
  // Verificar se o método é POST
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  // Obter e-mail do cabeçalho
  const email = req.headers["x-usuario-email"] as string;
  if (!email) {
    return res.status(400).json({ error: "E-mail não fornecido no cabeçalho" });
  }

  // Obter dados do corpo da requisição
  const {
    observacao,
    tipo,
    formaPagamento,
    valor,
    valorPago,
    dataVencimento,
    dataTransacao,
  } = req.body;
  const nome_banco = req.headers["x-nome-banco"] as string;

  // Verificar campos obrigatórios
  if (
    !nome_banco ||
    !observacao ||
    !tipo ||
    !formaPagamento ||
    !valor ||
    !dataVencimento
  ) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  let clientConnection;
  let usuarioId;

  try {
    // Criar a conexão com o banco do cliente
    clientConnection = await getClientConnection(nome_banco);

    // Buscar o ID do usuário com o e-mail fornecido
    const userSql = "SELECT id FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [
      email,
    ]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    usuarioId = userRows[0].id;

    // Preparar a inserção na tabela 'contas_a_pagar' com a data de vencimento correta
    const queryParamsContasAPagar = [
      observacao,
      valor,
      dataVencimento, // Usar a data de vencimento fornecida
      "Pendente", // Status inicial
      valorPago || 0, // Se não houver valor pago, será 0
    ];

    const queryContasAPagar = `
      INSERT INTO contas_a_pagar (observacao, valor, data_vencimento, status, valor_pago) 
      VALUES (?, ?, ?, ?, ?)
    `;

    // Inserir os dados na tabela 'contas_a_pagar'
    const [insertContasResult] = await clientConnection.query(
      queryContasAPagar,
      queryParamsContasAPagar,
    );

    const contaId = (insertContasResult as any).insertId;

    // Preparar a inserção na tabela 'saida'
    const queryParamsSaida = [
      observacao,
      tipo,
      formaPagamento,
      valor,
      dataTransacao,
      usuarioId,
      contaId, // Relacionando a saída com a conta a pagar
    ];

    const querySaida = `
      INSERT INTO saida (observacao, tipo, forma_pagamento, valor, data, usuario_id, conta_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    // Inserir dados na tabela 'saida'
    await clientConnection.query(querySaida, queryParamsSaida);

    // Retornar sucesso
    return res
      .status(201)
      .json({ message: "Saída e conta registradas com sucesso." });
  } catch (error) {
    console.error("Erro ao registrar saída:", error);
    if (clientConnection) {
      clientConnection.end();
    }
    return res.status(500).json({ error: "Erro interno do servidor." });
  } finally {
    // Fechar a conexão com o banco de dados se não foi fechada no catch
    if (clientConnection) clientConnection.end();
  }
}
