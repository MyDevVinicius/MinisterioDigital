import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";
import bcrypt from "bcryptjs";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { banco } = req.query;

  if (!banco || typeof banco !== "string") {
    return res.status(400).json({ message: "Banco de dados não fornecido." });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido." });
  }

  const { nome, email, senha, cargo } = req.body;

  if (!nome || !email || !senha || !cargo) {
    return res.status(400).json({ message: "Dados incompletos." });
  }

  let clientConnection;

  try {
    clientConnection = await getClientConnection(banco);

    // Criptografar a senha antes de salvar
    const hashedSenha = await bcrypt.hash(senha, 10);

    // Inserir o usuário na tabela de usuários
    await clientConnection.query(
      "INSERT INTO usuarios (nome, email, senha, cargo) VALUES (?, ?, ?, ?)",
      [nome, email, hashedSenha, cargo],
    );

    // Buscar a lista atualizada de usuários
    const [rows] = await clientConnection.query("SELECT * FROM usuarios");

    return res
      .status(201)
      .json({ message: "Usuário adicionado com sucesso.", usuarios: rows });
  } catch (error) {
    console.error("Erro ao adicionar usuário:", error);
    return res.status(500).json({ message: "Erro ao adicionar usuário." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
