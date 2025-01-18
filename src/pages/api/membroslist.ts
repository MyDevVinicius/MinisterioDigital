import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";
import { format } from "date-fns";

interface Membro {
  id: number;
  nome: string;
  data_nascimento: string | null;
  endereco: string | null;
  status: "ativo" | "inativo";
  numero: string | null;
  email: string | null;
}

// Função para formatar o número de telefone
function formatarNumero(numero: string | null): string | null {
  if (!numero) return null;

  // Remover qualquer caractere não numérico
  const apenasNumeros = numero.replace(/\D/g, "");

  // Verificar se o número tem o formato correto (11 ou 12 dígitos)
  if (apenasNumeros.length === 11) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros[2]} ${apenasNumeros.slice(3, 7)}-${apenasNumeros.slice(7)}`;
  } else if (apenasNumeros.length === 10) {
    return `(${apenasNumeros.slice(0, 2)}) ${apenasNumeros.slice(2, 6)}-${apenasNumeros.slice(6)}`;
  }

  return numero; // Caso não seja possível formatar, retorna o número original
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
    const [rows] = await connection.execute<Membro[]>(`
      SELECT id, nome, data_nascimento, endereco, status, numero, email, cpf, rg , estado_civil 
      FROM membros
    `);

    // Verificando os dados recebidos do banco
    console.log("Membros recebidos:", rows);

    // Formatar a data de nascimento e o número de telefone
    const membrosFormatados = rows.map((membro) => ({
      ...membro,
      data_nascimento: membro.data_nascimento
        ? format(new Date(membro.data_nascimento), "dd/MM/yyyy")
        : null, // Caso a data_nascimento seja nula
      numero: formatarNumero(membro.numero), // Formatar o número de telefone
    }));

    console.log("Membros formatados:", membrosFormatados); // Verifique os membros formatados

    return res.status(200).json({ membros: membrosFormatados });
  } catch (error) {
    console.error("Erro ao acessar o banco de dados:", error);
    return res.status(500).json({
      message: "Erro interno ao acessar o banco de dados",
      error: error instanceof Error ? error.message : error,
    });
  } finally {
    if (connection) connection.release();
  }
}
