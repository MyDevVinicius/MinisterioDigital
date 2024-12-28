import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para obter a conexão com o banco de dados do cliente

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verificar se o método é POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido." });
  }

  // Capturar os dados necessários do cabeçalho e do corpo da requisição
  const codigoVerificacao = req.headers["x-verificacao-chave"];
  const nomeBanco = req.headers["x-nome-banco"];
  const { userId, permissions } = req.body;

  // Validar o código de verificação
  if (!codigoVerificacao || typeof codigoVerificacao !== "string") {
    return res
      .status(400)
      .json({ message: "Código de verificação não fornecido." });
  }

  // Validar o nome do banco de dados
  if (!nomeBanco || typeof nomeBanco !== "string") {
    return res.status(400).json({ message: "Nome do banco não fornecido." });
  }

  // Validar o ID do usuário
  if (!userId || typeof userId !== "number") {
    return res
      .status(400)
      .json({ message: "ID do usuário não fornecido ou inválido." });
  }

  // Validar o objeto de permissões
  if (!permissions || typeof permissions !== "object") {
    return res
      .status(400)
      .json({ message: "Permissões não fornecidas ou inválidas." });
  }

  let clientConnection;

  try {
    console.log(`Criando conexão com o banco do cliente: ${nomeBanco}`);

    // Obter conexão com o banco de dados do cliente
    clientConnection = await getClientConnection(nomeBanco);

    // Percorrer as permissões fornecidas no corpo da requisição
    for (const [pageKey, pageData] of Object.entries(permissions)) {
      // Verificar se a chave "functions" é um array
      if (!Array.isArray(pageData.functions)) {
        console.warn(
          `A propriedade 'functions' não é um array para a página ${pageKey}`,
        );
        continue;
      }

      // Iterar sobre cada função da página
      for (const func of pageData.functions) {
        const enabled = Boolean(func.enabled); // Converter para booleano

        // Verificar se já existe uma permissão configurada com o mesmo valor
        const [existingPermission] = await clientConnection.query(
          `
            SELECT id, ativado
            FROM permissoes
            WHERE usuario_id = ? AND nome_pagina = ? AND nome_funcao = ?
          `,
          [userId, pageKey, func.name],
        );

        // Ignorar se a permissão já estiver configurada corretamente
        if (
          existingPermission &&
          existingPermission.ativado === (enabled ? 1 : 0)
        ) {
          console.log(
            `Permissão já configurada para ${pageKey} - ${func.name}: ${enabled}`,
          );
          continue;
        }

        // Inserir ou atualizar a permissão no banco de dados
        const [result] = await clientConnection.query(
          `
            INSERT INTO permissoes (usuario_id, nome_pagina, nome_funcao, ativado)
            VALUES (?, ?, ?, ?)
            ON DUPLICATE KEY UPDATE ativado = ?
          `,
          [userId, pageKey, func.name, enabled ? 1 : 0, enabled ? 1 : 0],
        );

        console.log("Permissão atualizada/inserida:", result);
      }
    }

    // Retornar sucesso após processar todas as permissões
    return res
      .status(200)
      .json({ message: "Permissões atualizadas com sucesso." });
  } catch (error: any) {
    console.error("Erro ao atualizar permissões:", error);
    return res.status(500).json({
      message: "Erro ao atualizar permissões.",
      details: error.message,
    });
  } finally {
    // Garantir que a conexão com o banco seja liberada
    if (clientConnection) clientConnection.release();
  }
}
