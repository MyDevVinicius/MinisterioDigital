import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db"; // Ajuste o caminho conforme necessário
import { RowDataPacket } from "mysql2";

// Função para lidar com as requisições de listar, editar e deletar formas de pagamento
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { method } = req;

  // Recupera os cabeçalhos para a chave de verificação e nome do banco
  const chave = req.headers["x-verificacao-chave"];
  const nomeBanco = req.headers["x-nome-banco"];

  // Log dos cabeçalhos para depuração
  console.log("Cabeçalhos da requisição:", req.headers);

  // Verifica se a chave e o nome do banco foram fornecidos corretamente
  if (
    !chave ||
    typeof chave !== "string" ||
    !nomeBanco ||
    typeof nomeBanco !== "string"
  ) {
    console.error("Chave ou nome do banco não fornecidos ou mal formatados.");
    return res.status(400).json({
      message: "Chave de verificação ou nome do banco não fornecidos.",
    });
  }

  let adminConnection;
  let clientConnection;

  try {
    // Conecta ao banco admin_db para verificar a chave de verificação
    adminConnection = await getClientConnection("admin_db");

    // Verifica o nome do banco associado à chave
    const [result] = await adminConnection.query<RowDataPacket[]>(
      "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
      [chave],
    );

    // Log para verificar o resultado da consulta
    console.log("Resultado da consulta de nome do banco:", result);

    if (result.length === 0) {
      console.error("Chave inválida.");
      return res.status(404).json({ message: "Chave inválida." });
    }

    const databaseName = result[0].nome_banco as string;

    // Se o nome do banco passado na requisição não corresponder ao nome do banco verificado
    if (databaseName !== nomeBanco) {
      console.error(
        "Nome do banco inválido, esperado:",
        databaseName,
        "recebido:",
        nomeBanco,
      );
      return res.status(400).json({ message: "Nome do banco inválido." });
    }

    // Conecta ao banco do cliente usando o nome do banco obtido
    clientConnection = await getClientConnection(databaseName);

    switch (method) {
      case "GET":
        // Consulta para buscar todas as formas de pagamento
        const [rows] = await clientConnection.query<RowDataPacket[]>(
          "SELECT * FROM formas_pagamento",
        );

        // Verifique se há resultados
        if (rows.length === 0) {
          return res
            .status(200)
            .json({ message: "Nenhuma forma de pagamento encontrada." });
        }

        // Retorna os dados encontrados
        return res.status(200).json(rows);

      case "PUT":
        // Log do corpo da requisição PUT para editar forma de pagamento
        console.log("Corpo da requisição PUT:", req.body);

        const { id, nome, tipo, ativo, quantidade_parcelas } = req.body;

        if (!id || !nome || !tipo) {
          console.error("Campos necessários não fornecidos:", {
            id,
            nome,
            tipo,
          });
          return res
            .status(400)
            .json({ message: "Campos necessários não fornecidos." });
        }

        const updateQuery = `
          UPDATE formas_pagamento
          SET nome = ?, tipo = ?, ativo = ?, quantidade_parcelas = ?
          WHERE id = ?
        `;
        await clientConnection.query(updateQuery, [
          nome,
          tipo,
          ativo,
          quantidade_parcelas,
          id,
        ]);

        return res
          .status(200)
          .json({ message: "Forma de pagamento atualizada com sucesso." });

      case "DELETE":
        // Log do parâmetro de query para DELETE
        console.log("Parâmetro de deleteId:", req.query.deleteId);

        const { deleteId } = req.query;

        if (!deleteId || typeof deleteId !== "string") {
          console.error(
            "ID da forma de pagamento não fornecido ou mal formatado.",
          );
          return res
            .status(400)
            .json({ message: "ID da forma de pagamento não fornecido." });
        }

        const deleteQuery = "DELETE FROM formas_pagamento WHERE id = ?";
        await clientConnection.query(deleteQuery, [deleteId]);

        return res
          .status(200)
          .json({ message: "Forma de pagamento deletada com sucesso." });

      default:
        console.error(`Método ${method} não permitido.`);
        return res
          .status(405)
          .json({ message: `Método ${method} não permitido.` });
    }
  } catch (error: any) {
    console.error("Erro ao processar a requisição:", error);
    return res.status(500).json({
      message: "Erro interno no servidor.",
    });
  } finally {
    if (adminConnection) adminConnection.release();
    if (clientConnection) clientConnection.release();
  }
}
