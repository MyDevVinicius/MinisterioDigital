import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection, getAdminConnection } from "../../../lib/db";
import { RowDataPacket, FieldPacket } from "mysql2";

interface ClienteStatus extends RowDataPacket {
  status: string;
}

// Função para buscar o status do cliente no banco
const fetchClientStatus = async (connection: any, clienteId: string) => {
  const [rows]: [ClienteStatus[], FieldPacket[]] = await connection.query(
    "SELECT status FROM clientes WHERE id = ?",
    [clienteId],
  );

  if (rows.length === 0) {
    console.log(`Cliente não encontrado no banco com ID: ${clienteId}`);
    return null; // Se não encontrar, retornar null
  }

  const status = rows[0]?.status?.trim().toLowerCase() || "não definido";
  console.log(`Status retornado do banco: ${status}`);
  return status;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { banco, clienteId } = req.query as {
    banco: string;
    clienteId: string;
  };

  // Verificação básica dos parâmetros de entrada
  if (!banco || typeof banco !== "string") {
    return res
      .status(400)
      .json({ message: "Banco de dados não fornecido ou inválido." });
  }

  if (!clienteId || typeof clienteId !== "string") {
    return res
      .status(400)
      .json({ message: "ID do cliente não fornecido ou inválido." });
  }

  let adminConnection = null;
  let clientConnection = null;

  try {
    // Conexão com o banco administrativo
    adminConnection = await getAdminConnection();
    console.log("Conectado ao banco administrativo.");

    // Busca o status do cliente no banco administrativo
    const adminStatus = await fetchClientStatus(adminConnection, clienteId);
    console.log("Status do cliente no banco administrativo:", adminStatus);

    // Se o cliente não for encontrado ou estiver inativo
    if (adminStatus === null) {
      return res
        .status(404)
        .json({ message: "Cliente não encontrado no banco administrativo." });
    }

    if (adminStatus !== "ativo") {
      console.log(
        `Status do cliente inativo. Status retornado: ${adminStatus}`,
      );
      return res.status(403).json({
        message: `O cliente está inativo. Acesso bloqueado. Status do cliente: ${adminStatus}`,
      });
    }

    // Conexão com o banco do cliente
    clientConnection = await getClientConnection(banco);
    if (!clientConnection) {
      console.error("Falha na conexão com o banco do cliente:", banco);
      return res
        .status(500)
        .json({ message: "Erro ao conectar ao banco de dados do cliente." });
    }

    console.log("Conectado ao banco do cliente:", banco);

    // Verifica o status do cliente no banco do cliente
    const clientStatus = await fetchClientStatus(clientConnection, clienteId);
    console.log("Status no banco do cliente:", clientStatus);

    if (clientStatus === "não definido") {
      return res
        .status(404)
        .json({ message: "Cliente não encontrado no banco do cliente." });
    }

    // Retorna a resposta com status do cliente
    return res.status(200).json({
      message: "Cliente autenticado com sucesso!",
      status: clientStatus,
    });
  } catch (error: any) {
    console.error("Erro ao buscar status do cliente:", error.message);
    return res
      .status(500)
      .json({ message: "Erro interno ao buscar status do cliente." });
  } finally {
    // Garantir que as conexões sejam liberadas
    if (adminConnection) await adminConnection.release();
    if (clientConnection) await clientConnection.release();
  }
}
