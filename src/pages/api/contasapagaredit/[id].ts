// pages/api/contasapagaredit.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../../lib/db";

// Função para formatar a data no formato YYYY-MM-DD
const formatDate = (date: string) => {
  const d = new Date(date);
  return d.toISOString().split("T")[0]; // Formato YYYY-MM-DD
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { id, observacao, valor, valor_pago, data_vencimento, nomeBanco } =
    req.body;

  // Verifica se os dados obrigatórios estão presentes
  if (
    !id ||
    !observacao ||
    !valor ||
    !valor_pago ||
    !data_vencimento ||
    !nomeBanco
  ) {
    return res.status(400).json({ message: "Dados incompletos" });
  }

  let clientConnection;
  try {
    // Valida o nome do banco
    if (!nomeBanco) {
      return res.status(400).json({ message: "Nome do banco não fornecido" });
    }

    // Converte a data de vencimento para o formato adequado (YYYY-MM-DD)
    const formattedDataVencimento = formatDate(data_vencimento);

    // Recalcula o status com base nos dados fornecidos
    const today = new Date();
    const dueDate = new Date(data_vencimento); // Data de vencimento
    const valorPago = parseFloat(valor_pago); // Valor pago
    const valorTotal = parseFloat(valor); // Valor total
    let status = "Pendente"; // Status padrão

    // Lógica de verificação do status
    if (valorPago === valorTotal) {
      status = "Pago"; // Se o valor pago for igual ao valor total, o status é 'Pago'
    } else if (valorPago === 0 && dueDate < today) {
      status = "Vencida"; // Se o valor pago for zero e a data de vencimento já passou, é 'Vencida'
    } else if (valorPago === 0 && dueDate > today) {
      status = "Pendente"; // Se o valor pago for zero, mas ainda está dentro do prazo, é 'Pendente'
    } else if (valorPago < valorTotal && dueDate < today) {
      status = "Vencida"; // Se o valor pago for menor que o total e a data já passou, é 'Vencida'
    } else if (valorPago < valorTotal && dueDate > today) {
      status = "Pago Parcial"; // Se o valor pago for menor que o total, mas dentro do prazo, é 'Pago Parcial'
    }

    // Estabelece a conexão com o banco usando o nome do banco fornecido
    clientConnection = await getClientConnection(nomeBanco);

    // Realiza a atualização da conta no banco de dados
    await clientConnection.execute(
      `
      UPDATE saida 
      SET observacao = ?, valor = ?, valor_pago = ?, data_vencimento = ?, status = ? 
      WHERE id = ?
      `,
      [observacao, valor, valor_pago, formattedDataVencimento, status, id],
    );

    // Resposta de sucesso
    res.status(200).json({ message: "Conta atualizada com sucesso" });
  } catch (error: unknown) {
    console.error("Erro ao editar conta:", error);
    res.status(500).json({
      message: "Erro ao editar conta",
      error: (error as Error).message || "Erro desconhecido",
    });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
