import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { id, nome, data_nascimento, endereco, status, usuario_id } = req.body;
  const nomeBanco = req.query.banco as string;

  if (!id || !nome || !data_nascimento || !status || !nomeBanco) {
    return res.status(400).json({ message: "Dados incompletos" });
  }

  let connection;

  try {
    connection = await getClientConnection(nomeBanco);

    // Atualiza o membro
    await connection.execute(
      "UPDATE membros SET nome = ?, data_nascimento = ?, endereco = ?, status = ?, usuario_id = ? WHERE id = ?",
      [nome, data_nascimento, endereco || null, status, usuario_id || null, id],
    );

    // Retorna todos os membros após atualização
    const [rows] = await connection.execute("SELECT * FROM membros");

    return res.status(200).json({ membros: rows });
  } catch (error) {
    console.error("Erro ao atualizar membro:", error);
    return res.status(500).json({ message: "Erro ao atualizar membro" });
  } finally {
    if (connection) connection.release();
  }
}
