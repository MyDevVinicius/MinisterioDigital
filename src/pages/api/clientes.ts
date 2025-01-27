import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

// Interface para a tipagem do cliente
interface Cliente extends RowDataPacket {
  nome_banco: string;
  nome_igreja: string;
  status: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Verificação do método HTTP
  if (req.method !== "POST") {
    return res.status(405).json({ error: `Método ${req.method} não permitido.` });
  }

  const { codigo_verificacao } = req.body;

  // Validação básica para o código de verificação
  if (!codigo_verificacao || typeof codigo_verificacao !== "string") {
    return res.status(400).json({ error: "Código de verificação é necessário." });
  }

  const sanitizedCodigo = String(codigo_verificacao).trim();

  if (sanitizedCodigo.length !== 6) { // Exemplo de validação de comprimento (ajuste conforme seu padrão)
    return res.status(400).json({ error: "Código de verificação inválido." });
  }

  let adminConnection;

  try {
    console.log("Iniciando autenticação do cliente...");

    // Conectar ao banco administrativo
    adminConnection = await getAdminConnection();
    if (!adminConnection) {
      return res.status(500).json({
        error: "Falha ao conectar com o banco de dados administrativo.",
      });
    }

    // Consulta SQL segura com uso de placeholders
    const sql = "SELECT nome_banco, nome_igreja, status FROM clientes WHERE codigo_verificacao = ?";
    const [rows] = await adminConnection.execute<Cliente[]>(sql, [sanitizedCodigo]);

    // Caso o cliente não seja encontrado
    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    const cliente = rows[0];
    const { nome_banco, nome_igreja, status } = cliente;

    // Verifica o status do cliente
    if (status !== "ativo") {
      return res.status(403).json({
        error: `Cliente está bloqueado. Entre em contato com o suporte. Status: ${status}`,
      });
    }

    // Sucesso na validação do cliente
    return res.status(200).json({
      message: "Cliente validado com sucesso!",
      cliente: {
        nome_banco,
        nome_igreja,
        status,
      },
    });
  } catch (error: any) {
    // Log de erro e retorno genérico
    console.error("Erro na autenticação do cliente:", error.message || error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  } finally {
    // Liberar a conexão corretamente com o método 'end()'
    if (adminConnection) {
      console.log("Liberando conexão com o banco administrativo.");
      try {
        await adminConnection.end();
      } catch (releaseError) {
        console.error("Erro ao liberar a conexão:", releaseError);
      }
    }
  }
}

