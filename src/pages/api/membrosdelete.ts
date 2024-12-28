import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { id } = req.query; // O ID vem da query string
  const nomeBanco = req.query.banco as string;

  if (!id || !nomeBanco) {
    return res
      .status(400)
      .json({ message: "ID ou nome do banco não fornecidos" });
  }

  let connection;

  try {
    connection = await getClientConnection(nomeBanco);

    // Executa a exclusão do membro
    await connection.execute("DELETE FROM membros WHERE id = ?", [id]);

    // Obtém a lista atualizada de membros após a exclusão
    const [rows] = await connection.execute("SELECT * FROM membros");

    return res.status(200).json({ membros: rows }); // Retorna os membros atualizados
  } catch (error) {
    console.error("Erro ao deletar membro:", error);
    return res.status(500).json({ message: "Erro ao deletar membro" });
  } finally {
    if (connection) connection.release();
  }
}
