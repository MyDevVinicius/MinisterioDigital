import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para obter a conexão com o banco de dados do cliente

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido." });
  }

  const codigoVerificacao = req.headers["x-verificacao-chave"];
  const nomeBanco = req.headers["x-nome-banco"];
  const { userId, permissions } = req.body;

  console.log("Recebido código de verificação:", codigoVerificacao);
  console.log("Recebido nome do banco:", nomeBanco);
  console.log("Recebido ID do usuário:", userId);
  console.log("Recebidas permissões:", permissions);

  if (!codigoVerificacao || typeof codigoVerificacao !== "string") {
    return res
      .status(400)
      .json({ message: "Código de verificação não fornecido." });
  }

  if (!nomeBanco || typeof nomeBanco !== "string") {
    return res.status(400).json({ message: "Nome do banco não fornecido." });
  }

  if (!userId || typeof userId !== "number") {
    return res
      .status(400)
      .json({ message: "ID do usuário não fornecido ou inválido." });
  }

  if (!permissions || typeof permissions !== "object") {
    return res
      .status(400)
      .json({ message: "Permissões não fornecidas ou inválidas." });
  }

  let clientConnection;

  try {
    console.log(`Criando pool para o banco do cliente: ${nomeBanco}`);

    // Conexão com o banco do cliente
    clientConnection = await getClientConnection(nomeBanco);

    // Atualizar permissões do usuário
    for (const [pageKey, pageData] of Object.entries(permissions)) {
      for (const func of pageData.functions) {
        // Certifique-se de que func.enabled é um booleano
        const enabled = Boolean(func.enabled); // Converte para verdadeiro/falso
        // Inserir ou atualizar a permissão no banco de dados
        const [result] = await clientConnection.query(
          `
            INSERT INTO ${nomeBanco}.permissoes (usuario_id, nome_pagina, nome_funcao, ativado)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ativado = ?
          `,
          [userId, pageKey, func.name, enabled ? 1 : 0, enabled ? 1 : 0],
        );
        // Log para verificar a atualização da permissão
        console.log("Resultado da operação:", result);
      }
    }

    return res
      .status(200)
      .json({ message: "Permissões atualizadas com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar permissões:", error);
    return res.status(500).json({ message: "Erro ao atualizar permissões." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
