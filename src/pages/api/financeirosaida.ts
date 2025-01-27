import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para conectar ao banco de dados do cliente
import { RowDataPacket } from "mysql2";

// Tipagem para o usuário
interface Usuario extends RowDataPacket {
  email: string;
  id: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificar se o método é POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Método ${req.method} não permitido` });
  }

  // Obter e-mail e nome do banco do cabeçalho
  const email = Array.isArray(req.headers["x-usuario-email"])
    ? req.headers["x-usuario-email"][0]
    : req.headers["x-usuario-email"];
  const nome_banco = Array.isArray(req.headers["x-nome-banco"])
    ? req.headers["x-nome-banco"][0]
    : req.headers["x-nome-banco"];

  if (!email) {
    return res.status(400).json({ error: "E-mail não fornecido no cabeçalho" });
  }

  if (!nome_banco) {
    return res.status(400).json({ error: "Nome do banco não fornecido." });
  }

  // Obter dados do corpo da requisição
  const {
    observacao,
    tipo,
    formaPagamento,
    valor,
    valorPago,
    dataVencimento,
    dataPagamento,
  } = req.body;

  // Verificar campos obrigatórios
  if (!tipo || !valor || !formaPagamento || !dataVencimento) {
    return res.status(400).json({ error: "Campos obrigatórios ausentes." });
  }

  let clientConnection;
  let usuarioId;

  try {
    // Criar a conexão com o banco do cliente utilizando pool
    clientConnection = await getClientConnection(nome_banco);

    // Buscar o ID do usuário com o e-mail fornecido
    const userSql = "SELECT id FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [email]);

    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    usuarioId = userRows[0].id;

    // Obter a data atual (hoje) para comparações
    const today = new Date();

    // Lógica para determinar o status com base em valorPago e dataVencimento
    let status = "Pendente"; // Default status

    // Verifica se valorPago é um número válido
    const parsedValorPago = parseFloat(valorPago as string);
    if (isNaN(parsedValorPago)) {
      return res.status(400).json({ error: "Valor pago inválido." });
    }

    if (parsedValorPago === valor) {
      status = "Pago"; // Se o valor pago for igual ao valor total, o status é 'Pago'
    } else if (
      parsedValorPago > 0 &&
      parsedValorPago < valor &&
      new Date(dataVencimento) >= today
    ) {
      status = "Pago Parcial"; // Valor pago parcial e dentro do prazo
    } else if (parsedValorPago === 0 && new Date(dataVencimento) >= today) {
      status = "Pendente"; // Não pago e dentro do prazo
    } else if (new Date(dataVencimento) < today) {
      status = "Vencida"; // Fora do prazo
    }

    // Garantir que o status está dentro dos valores esperados
    const validStatuses = ["Pago", "Pago Parcial", "Pendente", "Vencida"];
    if (!validStatuses.includes(status)) {
      status = "Pendente"; // Se algum valor inválido foi atribuído, definir o status como 'Pendente'
    }

    // Preparar a inserção na tabela 'saida'
    const queryParamsSaida = [
      tipo,
      observacao,
      valor,
      parsedValorPago || 0, // Valor pago opcional, padrão 0
      status, // Status determinado pela lógica
      formaPagamento,
      dataVencimento,
      dataPagamento || null, // Data de pagamento opcional
      usuarioId,
    ];

    const querySaida = `
      INSERT INTO saida (
        tipo, 
        observacao, 
        valor, 
        valor_pago, 
        status, 
        forma_pagamento, 
        data_vencimento, 
        data_pagamento, 
        usuario_id
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Inserir dados na tabela 'saida'
    await clientConnection.query(querySaida, queryParamsSaida);

    // Retornar sucesso
    return res.status(201).json({ message: "Saída registrada com sucesso." });
  } catch (error) {
    console.error("Erro ao registrar saída:", error);
    return res.status(500).json({
      error: "Erro interno do servidor.",
      details: error.message || "Erro desconhecido",
    });
  } finally {
    // Garantir que a conexão seja liberada corretamente
    if (clientConnection) {
      clientConnection.release(); // Usa o pool de conexões corretamente
    }
  }
}
