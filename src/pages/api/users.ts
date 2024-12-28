import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Certifique-se de ajustar o caminho do db.ts

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verificando o método da requisição
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  // Pegando os cabeçalhos enviados pela requisição
  const chaveVerificacao = req.headers["x-verificacao-chave"] as
    | string
    | undefined;
  const nomeBanco = req.headers["x-nome-banco"] as string | undefined;

  if (!chaveVerificacao || !nomeBanco) {
    return res.status(400).json({
      message: "Chave de verificação ou nome do banco não fornecidos.",
    });
  }

  let connection;

  try {
    // Obtendo a conexão com o banco do cliente usando o nome do banco recebido
    connection = await getClientConnection(nomeBanco);

    // Consulta para contar o número total de usuários na tabela 'usuarios'
    const [rows] = await connection.execute<any[]>(
      "SELECT COUNT(*) AS quantidade FROM usuarios",
    );

    // Retornando a quantidade de usuários
    const quantidade = rows[0].quantidade;

    return res.status(200).json({ quantidade });
  } catch (error: any) {
    console.error("Erro ao acessar o banco de dados:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  } finally {
    if (connection) connection.release();
  }
}
