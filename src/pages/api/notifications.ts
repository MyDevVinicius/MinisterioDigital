import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  let connection;

  try {
    // Conexão com o banco `admin_db`
    connection = await getClientConnection("admin_db");

    if (req.method === "GET") {
      // Consulta para buscar notificações
      const [notificacoes] = await connection.execute(
        `
        SELECT 
          id, 
          titulo AS title, 
          texto AS message, 
          data_lancamento AS created_at, 
          autor 
        FROM 
          notificacoes 
        ORDER BY 
          data_lancamento DESC
        `,
      );

      return res.status(200).json(notificacoes);
    } else {
      return res.status(405).json({ message: "Método não permitido." });
    }
  } catch (error) {
    console.error("Erro ao buscar notificações:", error);
    return res
      .status(500)
      .json({ message: "Erro interno do servidor", error: error.message });
  } finally {
    if (connection) {
      try {
        await connection.end();
      } catch (closeError) {
        console.error("Erro ao fechar a conexão com o banco:", closeError);
      }
    }
  }
}
