import { NextApiRequest, NextApiResponse } from "next";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { getClientConnection, getAdminConnection } from "../../../lib/db";
import { RowDataPacket } from "mysql2";
import { isEmail } from "validator";

// Tipagem do usuário e cliente
interface Usuario extends RowDataPacket {
  email: string;
  nome: string;
  senha: string;
}

interface Cliente extends RowDataPacket {
  nome_banco: string;
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

  const { email, senha, nome_banco, codigo_verificacao } = req.body;

  if (!email || !senha || !nome_banco || !codigo_verificacao) {
    return res.status(400).json({ error: "Todos os campos são obrigatórios." });
  }

  if (!isEmail(email)) {
    return res.status(400).json({ error: "Email inválido." });
  }

  let adminConnection;
  let clientConnection;

  try {
    console.log("Iniciando autenticação do cliente...");

    adminConnection = await getAdminConnection();
    console.log("Conexão com o banco administrativo estabelecida.");

    const sqlAdmin =
      "SELECT nome_banco, status FROM clientes WHERE nome_banco = ?";
    const [clientRows] = await adminConnection.execute<Cliente[]>(sqlAdmin, [
      nome_banco,
    ]);

    if (clientRows.length === 0) {
      console.warn("Cliente não encontrado no banco administrativo.");
      return res.status(404).json({ error: "Cliente não encontrado." });
    }

    const cliente = clientRows[0];

    if (cliente.status !== "ativo") {
      console.warn(`Cliente bloqueado. Status: ${cliente.status}`);
      return res.status(403).json({
        error: `O cliente está Bloqueado. Entre em contato com suporte !`,
      });
    }

    clientConnection = await getClientConnection(nome_banco);

    if (!clientConnection) {
      return res
        .status(500)
        .json({ error: "Erro ao conectar ao banco de dados do cliente" });
    }

    const userSql = "SELECT email, nome, senha FROM usuarios WHERE email = ?";
    const [userRows] = await clientConnection.execute<Usuario[]>(userSql, [
      email,
    ]);

    if (userRows.length === 0) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    const user = userRows[0];

    const senhaValida = await bcrypt.compare(senha, user.senha);
    if (!senhaValida) {
      return res.status(401).json({ error: "Email ou senha inválidos." });
    }

    const token = jwt.sign(
      { email: user.email, nome: user.nome },
      process.env.JWT_SECRET!,
      { expiresIn: "1h" },
    );

    return res.status(200).json({
      message: "Login realizado com sucesso!",
      token,
      usuario: {
        email: user.email,
        nome: user.nome,
      },
    });
  } catch (error) {
    console.error("Erro na autenticação:", error);
    return res.status(500).json({ error: "Erro interno do servidor" });
  } finally {
    if (adminConnection) {
      console.log("Liberando conexão com o banco administrativo.");
      adminConnection.release();
    }
    if (clientConnection) {
      console.log("Liberando conexão com o banco do cliente.");
      clientConnection.release();
    }
  }
}
