import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";
import bcrypt from "bcryptjs";
import { RowDataPacket } from "mysql2";

// Interface para a resposta da query do banco de dados
interface Usuario extends RowDataPacket {
  id: string;
  nome: string;
  email: string;
  senha: string;
  cargo: string;
  usuario_id?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { banco } = req.query as { banco: string };

  if (!banco || typeof banco !== "string") {
    return res.status(400).json({ message: "Banco de dados não fornecido." });
  }

  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido." });
  }

  const { id, nome, email, senha, cargo, usuario_id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "ID do usuário não fornecido." });
  }

  let clientConnection;

  try {
    clientConnection = await getClientConnection(banco);

    // Buscar o usuário atual para comparar os dados
    const [rows] = await clientConnection.query<Usuario[]>(
      "SELECT * FROM usuarios WHERE id = ?",
      [id],
    );
    const currentUser = rows[0];

    if (!currentUser) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }

    // Montar a consulta de atualização dinamicamente
    const updates: string[] = [];
    const values: (string | undefined)[] = [];

    if (nome && nome !== currentUser.nome) {
      updates.push("nome = ?");
      values.push(nome);
    }

    if (email && email !== currentUser.email) {
      updates.push("email = ?");
      values.push(email);
    }

    if (senha && !(await bcrypt.compare(senha, currentUser.senha))) {
      const hashedSenha = await bcrypt.hash(senha, 10);
      updates.push("senha = ?");
      values.push(hashedSenha);
    }

    if (cargo && cargo !== currentUser.cargo) {
      updates.push("cargo = ?");
      values.push(cargo);
    }

    if (usuario_id && usuario_id !== currentUser.usuario_id) {
      updates.push("usuario_id = ?");
      values.push(usuario_id);
    }

    if (updates.length > 0) {
      values.push(id);
      const query = `UPDATE usuarios SET ${updates.join(", ")} WHERE id = ?`;

      await clientConnection.query(query, values);
    }

    // Buscar a lista atualizada de usuários
    const [updatedRows] = await clientConnection.query<Usuario[]>(
      "SELECT * FROM usuarios",
    );

    return res.status(200).json({
      message: "Usuário atualizado com sucesso.",
      usuarios: updatedRows,
    });
  } catch (error: any) {
    console.error("Erro ao editar usuário:", error);
    return res.status(500).json({ message: "Erro ao editar usuário." });
  } finally {
    if (clientConnection) clientConnection.release();
  }
}
