import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../../lib/db"; // Ajuste o caminho conforme necessário
import { OkPacket } from "mysql2"; // Importa o tipo adequado para o resultado de consulta

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const {
    query: { id }, // Extrai o ID da URL
  } = req;

  if (req.method === "DELETE") {
    // Verificando os headers necessários
    const chave = Array.isArray(req.headers["x-verificacao-chave"])
      ? req.headers["x-verificacao-chave"][0]
      : req.headers["x-verificacao-chave"];

    const nomeBanco = Array.isArray(req.headers["x-nome-banco"])
      ? req.headers["x-nome-banco"][0]
      : req.headers["x-nome-banco"];

    // Se não fornecer chave ou nome do banco
    if (!chave || !nomeBanco) {
      return res.status(400).json({
        message: "Chave de verificação ou nome do banco não fornecidos.",
      });
    }

    // Verificando se o ID foi fornecido
    if (!id) {
      return res.status(400).json({
        message: "ID da entrada é obrigatório.",
      });
    }

    let clientConnection;

    try {
      // Conecta ao banco de dados
      clientConnection = await getClientConnection(nomeBanco);

      // A consulta SQL para deletar a entrada
      const query = `
        DELETE FROM entrada
        WHERE id = ?
      `;

      // Parâmetro para a consulta
      const queryParams = [id];

      // Executa a consulta de exclusão
      const [result] = await clientConnection.query<OkPacket>(
        query,
        queryParams,
      );

      // Verifica a quantidade de linhas afetadas
      if (result.affectedRows > 0) {
        return res.status(200).json({
          message: "Entrada deletada com sucesso!",
        });
      } else {
        return res.status(404).json({
          message: "Entrada não encontrada.",
        });
      }
    } catch (error) {
      console.error("Erro ao deletar entrada:", error);
      return res.status(500).json({
        message: "Erro interno no servidor.",
      });
    } finally {
      if (clientConnection) clientConnection.release();
    }
  } else {
    return res.status(405).json({
      message: `Método ${req.method} não permitido.`,
    });
  }
}
