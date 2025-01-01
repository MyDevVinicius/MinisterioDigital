import type { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import { getAdminConnection, getClientConnection } from "../../../lib/db"; // Certifique-se de ajustar o caminho para o arquivo db.ts
import { RowDataPacket, FieldPacket } from "mysql2";

// Interface para a resposta da query do banco de dados
interface ClienteRow extends RowDataPacket {
  nome_banco: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === "POST") {
    const { name, email, password, cargo, chave } = req.body;

    // Verificar se a chave de verificação foi fornecida
    if (!chave) {
      return res
        .status(400)
        .json({ error: "Chave de verificação é obrigatória" });
    }

    let adminConnection: any = null;
    let clientConnection: any = null;

    try {
      // Obtém a conexão do banco admin_db para verificar a chave de verificação
      adminConnection = await getAdminConnection();

      // Verifica a chave e obtém o nome do banco associado
      const [rows]: [ClienteRow[], FieldPacket[]] = await adminConnection.query(
        "SELECT nome_banco FROM clientes WHERE codigo_verificacao = ?",
        [chave],
      );

      if (rows.length === 0) {
        return res.status(404).json({ error: "Chave inválida" });
      }

      const databaseName = rows[0].nome_banco;

      // Agora que temos o nome do banco do cliente, obtemos a conexão com o banco do cliente
      clientConnection = await getClientConnection(databaseName);

      // Criptografa a senha do usuário
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insere o usuário no banco específico do cliente
      await clientConnection.query(
        "INSERT INTO users (name, email, password, cargo) VALUES (?, ?, ?, ?)",
        [name, email, hashedPassword, cargo],
      );

      return res
        .status(201)
        .json({ message: "Usuário registrado com sucesso" });
    } catch (error: any) {
      console.error("Erro ao registrar usuário:", error);
      return res.status(500).json({ error: "Erro ao registrar usuário" });
    } finally {
      if (adminConnection) {
        try {
          await adminConnection.release();
        } catch (releaseError) {
          console.error(
            "Erro ao liberar a conexão administrativa:",
            releaseError,
          );
        }
      }

      if (clientConnection) {
        try {
          await clientConnection.release();
        } catch (releaseError) {
          console.error("Erro ao liberar a conexão do cliente:", releaseError);
        }
      }
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Método ${req.method} não permitido`);
  }
}
