import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para conectar ao banco de dados do cliente
import { RowDataPacket } from "mysql2";

interface Usuario extends RowDataPacket {
  email: string;
  nome: string;
  cargo: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verifica se o método da requisição é GET
  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido` });
  }

  const { email, nome_banco } = req.query;

  // Verifica se todos os campos obrigatórios estão presentes
  if (!email || !nome_banco) {
    return res
      .status(400)
      .json({ error: "Email e nome_banco são obrigatórios." });
  }

  let clientConnection;

  try {
    // Conectar ao banco de dados do cliente usando o nome_banco
    clientConnection = await getClientConnection(nome_banco as string);

    // Consulta SQL para buscar os dados do usuário
    const userSql = "SELECT email, nome, cargo FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [
      email,
    ]);

    // Verifica se o usuário foi encontrado
    if (userRows.length === 0) {
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const user = userRows[0];

    // Retorna os dados do usuário
    return res.status(200).json({
      nome: user.nome,
      cargo: user.cargo,
    });
  } catch (error) {
    console.error("Erro ao buscar dados do usuário:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
