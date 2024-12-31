import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { id } = req.query;

  if (!id || typeof id !== "string" || isNaN(Number(id))) {
    return res.status(400).json({ message: "ID inválido" });
  }

  const idNumber = Number(id);

  let clientConnection;
  try {
    // Acesse o nome do banco corretamente
    const nomeBanco = req.headers["x-nome-banco"] as string; // Alterado para 'x-nome-banco'
    if (!nomeBanco) {
      return res.status(400).json({ message: "Nome do banco não fornecido" });
    }

    clientConnection = await getClientConnection(nomeBanco);

    const [result] = await clientConnection.execute(
      `DELETE FROM contas_a_pagar WHERE id = ?`,
      [idNumber],
    );

    if ((result as any).affectedRows === 0) {
      return res.status(404).json({ message: "Conta não encontrada" });
    }

    res.status(200).json({ message: "Conta excluída com sucesso" });
  } catch (error: unknown) {
    console.error("Erro ao excluir conta:", error);
    res.status(500).json({
      message: "Erro ao excluir conta",
      error: (error as Error).message || "Erro desconhecido",
    });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
