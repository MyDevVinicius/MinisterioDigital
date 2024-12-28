import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection, getClientConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

// Interface para a tipagem das contas
interface ContaAPagar extends RowDataPacket {
  id: number;
  observacao: string;
  valor: number;
  valor_pago: number;
  status: string;
  data_vencimento: string;
}

// Função para buscar as contas a pagar no banco de dados do cliente
const getContasAPagar = async (
  nomeBanco: string,
  status?: string,
): Promise<ContaAPagar[]> => {
  let sql =
    "SELECT id, observacao, valor, valor_pago, status, data_vencimento FROM contas_a_pagar";
  const values: any[] = [];

  if (status && status !== "Todos") {
    sql += " WHERE status = ?";
    values.push(status);
  }

  sql += " ORDER BY data_vencimento ASC";

  let clientConnection;
  try {
    clientConnection = await getClientConnection(nomeBanco);
    const [rows] = await clientConnection.query<ContaAPagar[]>(sql, values);
    return rows;
  } catch (error: any) {
    console.error("Erro ao buscar contas a pagar:", error);
    throw new Error("Erro ao buscar contas a pagar");
  } finally {
    if (clientConnection) clientConnection.release();
  }
};

const atualizarStatusContas = (contas: ContaAPagar[]): ContaAPagar[] => {
  const today = new Date();

  return contas.map((conta) => {
    const vencimento = new Date(conta.data_vencimento);
    if (
      vencimento < today &&
      conta.status !== "Pago" &&
      conta.status !== "Pago Parcial"
    ) {
      conta.status = "Vencida";
    } else if (
      vencimento >= today &&
      conta.status !== "Pago" &&
      conta.status !== "Pago Parcial"
    ) {
      conta.status = "Pendente";
    }
    return conta;
  });
};

// Handler para a API
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  let adminConnection;
  try {
    const { chave, status } = req.query;

    if (!chave || typeof chave !== "string") {
      return res
        .status(400)
        .json({ message: "Chave de verificação inválida." });
    }

    adminConnection = await getAdminConnection();
    const [result] = await adminConnection.query<ContaAPagar[]>(
      "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
      [chave],
    );

    if (result.length === 0) {
      return res
        .status(404)
        .json({ message: "Chave de verificação inválida." });
    }

    const nomeBanco = result[0].nome_banco as string;

    let contas = await getContasAPagar(nomeBanco, status as string);
    contas = atualizarStatusContas(contas);

    res.status(200).json({ message: "Sucesso", data: contas });
  } catch (error: unknown) {
    console.error("Erro ao processar a API de contas a pagar:", error);
    res.status(500).json({
      message: "Erro ao processar contas a pagar",
      error: (error as Error).message || "Erro desconhecido",
    });
  } finally {
    if (adminConnection) adminConnection.release();
  }
}
