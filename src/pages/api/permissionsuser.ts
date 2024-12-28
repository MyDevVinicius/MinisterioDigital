import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para obter a conexão com o banco de dados do cliente

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const codigoVerificacao = req.headers["x-verificacao-chave"];
  const nomeBanco = req.headers["x-nome-banco"];

  console.log("Recebido código de verificação:", codigoVerificacao);
  console.log("Recebido nome do banco:", nomeBanco);

  if (!codigoVerificacao || typeof codigoVerificacao !== "string") {
    return res
      .status(400)
      .json({ message: "Código de verificação não fornecido." });
  }

  if (!nomeBanco || typeof nomeBanco !== "string") {
    return res.status(400).json({ message: "Nome do banco não fornecido." });
  }

  let clientConnection;

  try {
    console.log(`Criando pool para o banco do cliente: ${nomeBanco}`);

    clientConnection = await getClientConnection("admin_db");

    if (req.method === "GET") {
      const [usuarios] = await clientConnection.query(
        `SELECT id, nome, email FROM ${nomeBanco}.usuarios`,
      );

      if (usuarios.length === 0) {
        return res.status(404).json({ message: "Nenhum usuário encontrado." });
      }

      const usuariosComPermissoes = await Promise.all(
        usuarios.map(async (usuario: any) => {
          const clienteConnection = await getClientConnection(nomeBanco);
          const [permissoes] = await clienteConnection.query(
            `SELECT p.nome_pagina, p.nome_funcao, p.ativado FROM ${nomeBanco}.permissoes p WHERE p.usuario_id = ?`,
            [usuario.id],
          );

          // Organize the permissions and make sure to handle 'ativado' properly
          const permissoesOrganizadas = permissoes.reduce(
            (acc: any, perm: any) => {
              const pageKey = perm.nome_pagina;
              if (!acc[pageKey]) {
                acc[pageKey] = { name: pageKey, functions: [] };
              }

              // Verifica o valor de ativado para definir se a função está habilitada ou não
              const isEnabled = perm.ativado === 1; // 1 = habilitado, 0 = desabilitado

              acc[pageKey].functions.push({
                name: perm.nome_funcao,
                enabled: isEnabled,
              });
              return acc;
            },
            {},
          );

          return {
            id: usuario.id,
            name: usuario.nome,
            email: usuario.email,
            permissions: permissoesOrganizadas,
          };
        }),
      );

      return res.status(200).json(usuariosComPermissoes);
    }

    return res.status(405).json({ message: "Método não permitido." });
  } catch (error) {
    console.error("Erro ao buscar usuários e permissões:", error);
    return res.status(500).json({ message: "Erro ao buscar dados." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
