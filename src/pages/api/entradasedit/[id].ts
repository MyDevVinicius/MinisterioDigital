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

  if (req.method === "PUT") {
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

    const {
      observacao,
      tipo,
      forma_pagamento,
      valor,
      data_Lancamento,
      membro_id,
    } = req.body;

    // Verificando se todos os campos obrigatórios estão presentes
    if (
      !id ||
      !observacao ||
      !tipo ||
      !forma_pagamento ||
      !valor ||
      !data_Lancamento
    ) {
      return res.status(400).json({
        message: "Todos os campos são obrigatórios.",
      });
    }

    let clientConnection;

    try {
      // Conecta ao banco de dados
      clientConnection = await getClientConnection(nomeBanco);

      // A consulta SQL para atualizar a entrada
      const query = `
        UPDATE entrada
        SET 
          observacao = ?, 
          tipo = ?, 
          forma_pagamento = ?, 
          valor = ?, 
          data = ?, 
          membro_id = ?
        WHERE id = ?
      `;

      // Parâmetros para a consulta
      const queryParams = [
        observacao,
        tipo,
        forma_pagamento,
        valor,
        new Date(data_Lancamento), // Converte a data para Date
        membro_id,
        id, // ID extraído da URL
      ];

      // Executa a consulta de atualização
      const [result] = await clientConnection.query<OkPacket>(
        query,
        queryParams,
      );

      // Verifica a quantidade de linhas afetadas
      if (result.affectedRows > 0) {
        return res.status(200).json({
          message: "Entrada atualizada com sucesso!",
        });
      } else {
        return res.status(404).json({
          message: "Entrada não encontrada.",
        });
      }
    } catch (error) {
      console.error("Erro ao atualizar entrada:", error);
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
