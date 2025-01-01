import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verificar se a requisição é POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  // Extrair os dados do corpo da requisição
  const { nome, data_nascimento, endereco, status } = req.body;
  const nomeBanco = req.query.banco as string;

  // Verificar se todos os dados necessários foram fornecidos
  if (!nome || !data_nascimento || !status || !nomeBanco) {
    return res.status(400).json({ message: "Dados incompletos" });
  }

  let connection;

  try {
    // Obter a conexão com o banco de dados
    connection = await getClientConnection(nomeBanco);

    // Inserir o novo membro na tabela 'membros'
    const [result] = await connection.execute(
      "INSERT INTO membros (nome, data_nascimento, endereco, status) VALUES (?, ?, ?, ?)",
      [nome, data_nascimento, endereco || null, status],
    );

    // Recuperar todos os membros para retornar na resposta
    const [rows] = await connection.execute("SELECT * FROM membros");

    // Retornar a lista de membros após a inserção
    return res.status(201).json({ membros: rows });
  } catch (error) {
    console.error("Erro ao adicionar membro:", error);
    return res.status(500).json({ message: "Erro ao adicionar membro" });
  } finally {
    // Garantir que a conexão seja liberada após o uso
    if (connection) connection.release();
  }
}
