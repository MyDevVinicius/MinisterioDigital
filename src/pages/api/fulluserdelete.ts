import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { banco, id } = req.query;

  if (!banco || typeof banco !== "string") {
    return res.status(400).json({ message: "Banco de dados não fornecido." });
  }

  if (!id || typeof id !== "string") {
    return res.status(400).json({ message: "ID do usuário não fornecido." });
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Método não permitido." });
  }

  let clientConnection;

  try {
    clientConnection = await getClientConnection(banco);

    await clientConnection.query("DELETE FROM usuarios WHERE id = ?", [id]);

    return res.status(200).json({ message: "Usuário deletado com sucesso." });
  } catch (error) {
    console.error("Erro ao deletar usuário:", error);
    return res.status(500).json({ message: "Erro ao deletar usuário." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
