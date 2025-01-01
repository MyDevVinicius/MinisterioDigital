import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection } from "../../../lib/db";
import { RowDataPacket, FieldPacket } from "mysql2";

interface ClienteStatus extends RowDataPacket {
  status: string;
}

// Função para buscar o status do cliente no banco
const fetchClientStatus = async (
  connection: any,
  codigoVerificacao: string,
) => {
  const [rows]: [ClienteStatus[], FieldPacket[]] = await connection.query(
    "SELECT status FROM clientes WHERE codigo_verificacao = ?",
    [codigoVerificacao],
  );

  if (rows.length === 0) {
    console.log(
      `Cliente não encontrado no banco com código de verificação: ${codigoVerificacao}`,
    );
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
  const { codigoVerificacao } = req.query as {
    codigoVerificacao: string;
  };

  // Verificação básica dos parâmetros de entrada
  if (!codigoVerificacao || typeof codigoVerificacao !== "string") {
    console.log("Código de verificação não fornecido ou inválido.");
    return res
      .status(400)
      .json({ message: "Código de verificação não fornecido ou inválido." });
  }

  let adminConnection = null;

  try {
    // Conexão com o banco administrativo
    adminConnection = await getAdminConnection();
    console.log("Conectado ao banco administrativo.");

    // Busca o status do cliente no banco administrativo
    const adminStatus = await fetchClientStatus(
      adminConnection,
      codigoVerificacao,
    );
    console.log("Status do cliente no banco administrativo:", adminStatus);

    // Se o cliente não for encontrado ou estiver inativo
    if (adminStatus === null) {
      console.log("Cliente não encontrado no banco administrativo.");
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

    console.log("Cliente ativo, retornando status.");
    // Retorna a resposta com status do cliente ativo
    return res.status(200).json({
      message: "Cliente autenticado com sucesso!",
      status: adminStatus,
    });
  } catch (error: any) {
    console.error("Erro ao buscar status do cliente:", error.message);
    return res
      .status(500)
      .json({ message: "Erro interno ao buscar status do cliente." });
  } finally {
    // Garantir que as conexões sejam liberadas
    if (adminConnection) {
      try {
        await adminConnection.release();
      } catch (releaseError) {
        console.error(
          "Erro ao liberar a conexão administrativa:",
          releaseError,
        );
      }
    }
  }
}
