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
    const nomeBanco = req.headers["x-nome-banco"] as string;
    if (!nomeBanco) {
      return res.status(400).json({ message: "Nome do banco não fornecido" });
    }

    clientConnection = await getClientConnection(nomeBanco);

    // Iniciar uma transação para garantir a integridade dos dados
    await clientConnection.beginTransaction();

    // Excluir da tabela 'saida' com base no id fornecido
    const [saidaResult] = await clientConnection.execute(
      `DELETE FROM saida WHERE id = ?`,
      [idNumber],
    );

    if ((saidaResult as any).affectedRows === 0) {
      // Se não houver saída com o id fornecido, desfazemos a transação e retornamos o erro
      await clientConnection.rollback();
      return res.status(404).json({ message: "Saída não encontrada" });
    }

    // Com a exclusão realizada, confirmamos a transação
    await clientConnection.commit();

    res.status(200).json({ message: "Saída excluída com sucesso" });
  } catch (error: unknown) {
    console.error("Erro ao excluir saída:", error);

    // Se ocorreu qualquer erro, desfazemos a transação
    if (clientConnection) {
      await clientConnection.rollback();
    }

    res.status(500).json({
      message: "Erro ao excluir saída",
      error: (error as Error).message || "Erro desconhecido",
    });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
