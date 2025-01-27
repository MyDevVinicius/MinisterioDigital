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

  const { email } = req.query;

  // Obtém o nome do banco a partir do cabeçalho ou da query (se enviado pelo cliente)
  const nome_banco = req.headers["nome-banco"] || req.query["nome_banco"];

  // Verifica se todos os campos obrigatórios estão presentes
  if (!email || typeof email !== "string" || !nome_banco || typeof nome_banco !== "string") {
    return res
      .status(400)
      .json({ error: "Email e nome_banco são obrigatórios e devem ser strings válidas." });
  }

  let clientConnection;

  try {
    // Conectar ao banco de dados do cliente usando o nome_banco
    clientConnection = await getClientConnection(nome_banco);

    // Consulta SQL para buscar os dados do usuário
    const userSql = "SELECT email, nome, cargo FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [email]);

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

    // Verifica se o erro é de conexão ou relacionado ao banco
    if (error.code === "ECONNREFUSED") {
      return res.status(500).json({ error: "Falha na conexão com o banco de dados" });
    }

    // Caso o erro não seja específico, trata como erro interno do servidor
    return res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    // Fecha a conexão com o banco, se aberta
    if (clientConnection) {
      try {
        await clientConnection.release();
      } catch (releaseError) {
        console.error("Erro ao liberar a conexão:", releaseError);
        // É importante registrar o erro de liberação da conexão, mas não interromper o fluxo
      }
    }
  }
}
