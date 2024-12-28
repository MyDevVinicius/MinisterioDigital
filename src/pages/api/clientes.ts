import { NextApiRequest, NextApiResponse } from "next";
import { getAdminConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";

interface Cliente extends RowDataPacket {
  nome_banco: string;
  nome_igreja: string;
  status: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ error: `Método ${req.method} não permitido.` });
  }

  const { codigo_verificacao } = req.body;

  if (!codigo_verificacao) {
    return res
      .status(400)
      .json({ error: "Código de verificação é necessário." });
  }

  const sanitizedCodigo = String(codigo_verificacao).trim();

  let adminConnection;

  try {
    console.log("Iniciando autenticação do cliente...");

    adminConnection = await getAdminConnection();
    if (!adminConnection) {
      return res.status(500).json({
        error: "Falha ao conectar com o banco de dados administrativo.",
      });
    }

    const sql =
      "SELECT nome_banco, nome_igreja, status FROM clientes WHERE codigo_verificacao = ?";
    const [rows] = await adminConnection.execute<Cliente[]>(sql, [
      sanitizedCodigo,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    const cliente = rows[0];
    const { nome_banco, nome_igreja, status } = cliente;

    if (status !== "ativo") {
      return res.status(403).json({
        error: `Cliente está bloqueado. Entre em contato com o suporte. Status: ${status}`,
      });
    }

    return res.status(200).json({
      message: "Cliente validado com sucesso!",
      cliente: {
        nome_banco,
        nome_igreja,
        status,
      },
    });
  } catch (error: any) {
    // Aqui tratamos o erro como qualquer tipo (any), para evitar o erro 'unknown'
    console.error("Erro na autenticação do cliente:", error.message || error);
    return res.status(500).json({ error: "Erro interno do servidor." });
  } finally {
    if (adminConnection) {
      console.log("Liberando conexão com o banco administrativo.");
      await adminConnection.release();
    }
  }
}
