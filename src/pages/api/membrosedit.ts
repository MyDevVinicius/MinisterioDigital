import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";
import { format } from "date-fns";

interface Membro {
  id: number;
  nome: string;
  data_nascimento: string;
  endereco: string | null;
  status: "ativo" | "inativo";
  numero: string | null;
  email: string | null;
  rg: string | null;
  cpf: string | null;
  estado_civil: "solteiro" | "casado" | "divorciado" | "viuvo" | null;
  imagem: Buffer | null;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "PUT") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const { id, nome, data_nascimento, endereco, status, numero, email, imagem } =
    req.body;
  const nomeBanco = req.query.banco as string;

  // Verifica se todos os campos obrigatórios estão presentes
  if (!id || !nome || !data_nascimento || !status || !nomeBanco) {
    return res.status(400).json({
      message:
        "Dados incompletos: id, nome, data_nascimento, status e nomeBanco são obrigatórios.",
    });
  }

  let connection;

  try {
    connection = await getClientConnection(nomeBanco);

    // Atualiza o membro com os campos fornecidos
    await connection.execute(
      "UPDATE membros SET nome = ?, data_nascimento = ?, endereco = ?, status = ?, numero = ?, email = ? WHERE id = ?",
      [
        nome,
        data_nascimento,
        endereco || null,
        status,
        numero || null, // O número é opcional
        email || null, // O e-mail também é opcional
        imagem || null, // A imagem é opcional
        id,
      ],
    );

    // Recupera todos os membros atualizados
    const [rows] = await connection.execute<Membro[]>(`
      SELECT id, nome, data_nascimento, endereco, status, numero, email, rg, cpf, estado_civil
      FROM membros
    `);

    // Formata a data de nascimento
    const membrosFormatados = rows.map((membro) => ({
      ...membro,
      data_nascimento: membro.data_nascimento
        ? format(new Date(membro.data_nascimento), "dd/MM/yyyy")
        : null, // Se a data de nascimento for null, mantemos null
    }));

    return res.status(200).json({ membros: membrosFormatados });
  } catch (error) {
    console.error("Erro ao atualizar membro:", error);
    return res.status(500).json({ message: "Erro ao atualizar membro" });
  } finally {
    if (connection) connection.release();
  }
}
