import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Função para obter a conexão com o banco de dados do cliente
import { isEmail } from "validator"; // Biblioteca para validar email

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { email, nomeBanco } = req.query;

  // Validação de entrada
  if (!email || typeof email !== "string" || !isEmail(email)) {
    return res.status(400).json({ message: "Email inválido ou não fornecido." });
  }

  if (!nomeBanco || typeof nomeBanco !== "string") {
    return res.status(400).json({ message: "Nome do banco não fornecido." });
  }

  let clientConnection;

  try {
    console.log(`Conectando ao banco do cliente: ${nomeBanco}`);
    clientConnection = await getClientConnection(nomeBanco);

    if (req.method === "GET") {
      // Consultar as permissões do usuário no banco do cliente
      const [permissoes] = await clientConnection.query(
        `
        SELECT u.id, u.nome, u.email, p.nome_pagina, p.nome_funcao, p.ativado
        FROM ${nomeBanco}.usuarios u
        JOIN ${nomeBanco}.permissoes p ON u.id = p.usuario_id
        WHERE u.email = ?;
        `,
        [email]
      );

      if (permissoes.length === 0) {
        return res.status(404).json({
          message: "Nenhuma permissão encontrada para este usuário.",
        });
      }

      // Retornar as permissões
      return res.status(200).json({ permissoes });
    }

    // Se o método não for GET
    return res.status(405).json({ message: "Método não permitido." });
  } catch (error) {
    console.error("Erro ao verificar permissões:", error);

    // Retornar mensagem de erro genérica para o cliente
    return res.status(500).json({ message: "Erro ao verificar permissões." });
  } finally {
    // Garantir que a conexão seja liberada
    if (clientConnection) {
      try {
        await clientConnection.end(); // Usar end() para garantir que a conexão seja fechada corretamente
      } catch (releaseError) {
        console.error("Erro ao liberar a conexão:", releaseError);
      }
    }
  }
}
