import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { banco } = req.query;

  if (!banco || typeof banco !== "string") {
    return res.status(400).json({ message: "Banco de dados não fornecido." });
  }

  let clientConnection;

  try {
    clientConnection = await getClientConnection(banco);

    if (req.method === "GET") {
      const [rows] = await clientConnection.query("SELECT * FROM usuarios");

      return res.status(200).json(rows);
    }

    return res.status(405).json({ message: "Método não permitido." });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return res.status(500).json({ message: "Erro ao buscar usuários." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
