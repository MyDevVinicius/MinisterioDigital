import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";
import { format } from "date-fns";

interface Membro {
  id: number;
  nome: string;
  data_nascimento: string;
  endereco: string | null;
  status: "ativo" | "inativo";
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const nomeBanco = req.query.banco as string;

  if (!nomeBanco) {
    return res.status(400).json({ message: "Nome do banco não fornecido" });
  }

  let connection;

  try {
    connection = await getClientConnection(nomeBanco);

    // Consultar membros
    const [rows] = await connection.execute<Membro[]>(
      "SELECT id, nome, data_nascimento, endereco, status FROM membros",
    );

    // Formatar a data de nascimento para o formato dd/MM/yyyy
    const membrosFormatados = rows.map((membro) => ({
      ...membro,
      data_nascimento: membro.data_nascimento
        ? format(new Date(membro.data_nascimento), "dd/MM/yyyy")
        : null, // Caso a data_nascimento seja nula
    }));

    return res.status(200).json({ membros: membrosFormatados });
  } catch (error) {
    console.error("Erro ao acessar o banco de dados:", error);
    return res.status(500).json({ message: "Erro interno do servidor" });
  } finally {
    if (connection) connection.release();
  }
}
