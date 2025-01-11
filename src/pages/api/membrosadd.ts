import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  // Verificar se a requisição é POST
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  // Extrair os dados do corpo da requisição
  const { nome, data_nascimento, endereco, status, whatsapp, email } = req.body;
  const nomeBanco = req.query.banco as string;

  // Verificar se todos os dados necessários foram fornecidos
  if (!nome || !data_nascimento || !status || !nomeBanco) {
    return res.status(400).json({ message: "Dados incompletos" });
  }

  // Log para verificar o corpo da requisição
  console.log("Body da requisição:", req.body);

  // Validar o número de telefone (opcional, mas recomendado)
  const telefoneRegex = /^[0-9]{10,15}$/; // Somente números com 10 a 15 dígitos
  if (whatsapp && !telefoneRegex.test(whatsapp)) {
    return res.status(400).json({ message: "Número de telefone inválido" });
  }

  // Log para verificar o número antes da inserção
  console.log("Número antes da inserção:", whatsapp);

  let connection;

  try {
    // Obter a conexão com o banco de dados
    connection = await getClientConnection(nomeBanco);

    // Inserir o novo membro na tabela 'membros'
    const [result] = await connection.execute(
      "INSERT INTO membros (nome, data_nascimento, endereco, status, numero, email) VALUES (?, ?, ?, ?, ?, ?)",
      [
        nome,
        data_nascimento,
        endereco || null, // Atribui null se o endereço não for fornecido
        status,
        whatsapp || null, // Atribui null se o número não for fornecido
        email || null, // Atribui null se o e-mail não for fornecido
      ],
    );

    // Log do resultado da inserção
    console.log("Resultado da inserção:", result);

    // Recuperar todos os membros após a inserção para retornar na resposta
    const [rows] = await connection.execute("SELECT * FROM membros");

    // Log dos membros após a inserção
    console.log("Membros após inserção:", rows);

    // Retornar a lista de membros após a inserção
    return res.status(201).json({ membros: rows });
  } catch (error) {
    console.error("Erro ao adicionar membro:", error);
    return res.status(500).json({ message: "Erro ao adicionar membro", error });
  } finally {
    // Garantir que a conexão seja liberada após o uso
    if (connection) connection.release();
  }
}
