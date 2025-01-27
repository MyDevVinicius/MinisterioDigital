import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para obter a conexão com o banco de dados do cliente

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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
    return res.status(400).json({ message: "Código de verificação não fornecido." });
  }

  // Validar o nome do banco de dados
  if (!nomeBanco || typeof nomeBanco !== "string") {
    return res.status(400).json({ message: "Nome do banco não fornecido." });
  }

  // Validar o ID do usuário
  if (!userId || typeof userId !== "number" || userId <= 0) {
    return res.status(400).json({ message: "ID do usuário não fornecido ou inválido." });
  }

  // Validar o objeto de permissões
  if (!permissions || typeof permissions !== "object" || Object.keys(permissions).length === 0) {
    return res.status(400).json({ message: "Permissões não fornecidas ou inválidas." });
  }

  let clientConnection;

  try {
    console.log(`Criando conexão com o banco do cliente: ${nomeBanco}`);

    // Obter conexão com o banco de dados do cliente
    clientConnection = await getClientConnection(nomeBanco);

    // Para armazenar as promessas de atualização
    const permissionPromises = [];

    // Percorrer as permissões fornecidas no corpo da requisição
    for (const [pageKey, pageData] of Object.entries(permissions)) {
      // Verificar se a chave 'functions' é um array e se contém dados
      if (!Array.isArray(pageData.functions) || pageData.functions.length === 0) {
        console.warn(`A propriedade 'functions' não é um array ou está vazia para a página ${pageKey}`);
        continue;
      }

      // Iterar sobre cada função da página
      for (const func of pageData.functions) {
        const enabled = Boolean(func.enabled); // Converter para booleano

        // Preparar a query para verificar se a permissão já existe
        const checkPermissionQuery = `
          SELECT id, ativado
          FROM permissoes
          WHERE usuario_id = ? AND nome_pagina = ? AND nome_funcao = ?
        `;

        // Preparar a query para inserir ou atualizar a permissão
        const upsertPermissionQuery = `
          INSERT INTO permissoes (usuario_id, nome_pagina, nome_funcao, ativado)
          VALUES (?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE ativado = ?
        `;

        // Verificar se a permissão já está configurada corretamente
        permissionPromises.push(
          clientConnection.query(checkPermissionQuery, [userId, pageKey, func.name])
            .then(([existingPermission]: any) => {
              if (
                existingPermission.length === 0 || 
                existingPermission[0].ativado !== (enabled ? 1 : 0)
              ) {
                // Inserir ou atualizar a permissão no banco de dados
                return clientConnection.query(upsertPermissionQuery, [
                  userId, pageKey, func.name, enabled ? 1 : 0, enabled ? 1 : 0
                ]);
              } else {
                console.log(`Permissão já configurada para ${pageKey} - ${func.name}: ${enabled}`);
              }
            })
            .catch((error: any) => {
              console.error(`Erro ao processar permissão para ${pageKey} - ${func.name}:`, error);
            })
        );
      }
    }

    // Aguardar todas as permissões serem processadas
    await Promise.all(permissionPromises);

    // Retornar sucesso após processar todas as permissões
    return res.status(200).json({ message: "Permissões atualizadas com sucesso." });
  } catch (error: any) {
    console.error("Erro ao atualizar permissões:", error);
    return res.status(500).json({
      message: "Erro ao atualizar permissões.",
      details: error.message || error,
    });
  } finally {
    // Garantir que a conexão com o banco seja liberada
    if (clientConnection) {
      try {
        clientConnection.release();
      } catch (releaseError) {
        console.error("Erro ao liberar a conexão:", releaseError);
      }
    }
  }
}
