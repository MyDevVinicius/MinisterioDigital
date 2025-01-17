import path from "path";
import fs from "fs";
import { IncomingForm } from "formidable";
import { NextApiRequest, NextApiResponse } from "next";
import { getClientConnection } from "../../../lib/db";

export const config = {
  api: {
    bodyParser: false, // Desabilita o body parser para usar formidable
  },
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Método não permitido" });
  }

  const form = new IncomingForm() as any; // Força o tipo para 'any' para evitar erro
  const uploadDir = path.join(process.cwd(), "public", "uploads"); // Diretório de uploads na pasta public
  form.uploadDir = uploadDir; // Defina o diretório de upload
  form.keepExtensions = true; // Manter as extensões dos arquivos

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error("Erro ao processar o formulário:", err);
      return res
        .status(500)
        .json({ message: "Erro ao processar o formulário" });
    }

    const nome = Array.isArray(fields.nome) ? fields.nome[0] : fields.nome;
    const data_nascimento = Array.isArray(fields.data_nascimento)
      ? fields.data_nascimento[0]
      : fields.data_nascimento;
    const endereco = Array.isArray(fields.endereco)
      ? fields.endereco[0]
      : fields.endereco;
    const status = Array.isArray(fields.status)
      ? fields.status[0]
      : fields.status;
    const numero = Array.isArray(fields.numero)
      ? fields.numero[0]
      : fields.numero;
    const email = Array.isArray(fields.email) ? fields.email[0] : fields.email;
    const nomeBanco = req.query.banco as string;
    const imagem = files.imagem
      ? Array.isArray(files.imagem)
        ? files.imagem[0]
        : files.imagem
      : null;

    if (!nome || !data_nascimento || !status || !nomeBanco) {
      return res.status(400).json({ message: "Dados incompletos" });
    }

    // Validar o valor de status
    if (status !== "ativo" && status !== "inativo") {
      return res
        .status(400)
        .json({ message: 'Status inválido. Use "ativo" ou "inativo".' });
    }

    // Validar o número de telefone (opcional, mas recomendado)
    const telefoneRegex = /^[0-9]{10,15}$/;
    if (numero && !telefoneRegex.test(numero as string)) {
      return res.status(400).json({ message: "Número de telefone inválido" });
    }

    let connection;
    try {
      connection = await getClientConnection(nomeBanco);

      let imagemUrl = null;
      if (imagem) {
        // Garantir que a imagem foi salva corretamente
        const imagemPath = path.join(uploadDir, imagem.newFilename); // Caminho completo para a imagem salva
        imagemUrl = `/uploads/${imagem.newFilename}`; // A URL ou caminho do arquivo salvo

        // Verificar se a imagem foi realmente salva no diretório
        if (!fs.existsSync(imagemPath)) {
          return res
            .status(500)
            .json({ message: "Imagem não salva corretamente" });
        }
      }

      // Inserir o novo membro na tabela 'membros'
      const [result] = await connection.execute(
        "INSERT INTO membros (nome, data_nascimento, endereco, status, numero, email, imagem) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [
          nome,
          data_nascimento,
          endereco || null,
          status, // Agora o status está validado
          numero || null,
          email || null,
          imagemUrl, // A URL da imagem
        ],
      );

      // Recuperar todos os membros após a inserção
      const [rows] = await connection.execute("SELECT * FROM membros");

      return res.status(201).json({ membros: rows });
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      return res
        .status(500)
        .json({ message: "Erro ao adicionar membro", error });
    } finally {
      if (connection) connection.release();
    }
  });
}
