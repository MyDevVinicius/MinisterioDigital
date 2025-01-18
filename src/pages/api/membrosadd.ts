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

  const form = new IncomingForm();

  form.parse(req, async (err, fields) => {
    if (err) {
      console.error("Erro ao processar o formulário:", err);
      return res
        .status(500)
        .json({ message: "Erro ao processar o formulário", error: err });
    }

    try {
      // Campos recebidos
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
      const email = Array.isArray(fields.email)
        ? fields.email[0]
        : fields.email;
      const cpf = Array.isArray(fields.cpf) ? fields.cpf[0] : fields.cpf;
      const rg = Array.isArray(fields.rg) ? fields.rg[0] : fields.rg;
      const estado_civil = Array.isArray(fields.estado_civil)
        ? fields.estado_civil[0]
        : fields.estado_civil;
      const nomeBanco = req.query.banco as string;

      // Validações
      if (!nome || !data_nascimento || !status || !nomeBanco) {
        return res.status(400).json({ message: "Dados incompletos" });
      }

      if (!["ativo", "inativo"].includes(status)) {
        return res
          .status(400)
          .json({ message: 'Status inválido. Use "ativo" ou "inativo".' });
      }

      const telefoneRegex = /^[0-9]{10,15}$/;
      if (numero && !telefoneRegex.test(numero)) {
        return res.status(400).json({ message: "Número de telefone inválido" });
      }

      const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
      if (cpf && !cpfRegex.test(cpf)) {
        return res.status(400).json({ message: "CPF inválido" });
      }

      const estadoCivilOpcoes = ["solteiro", "casado", "divorciado", "viuvo"];
      if (estado_civil && !estadoCivilOpcoes.includes(estado_civil)) {
        return res.status(400).json({ message: "Estado civil inválido" });
      }

      // Conexão com o banco
      const connection = await getClientConnection(nomeBanco);

      const [result] = await connection.execute(
        "INSERT INTO membros (nome, data_nascimento, endereco, status, numero, email, cpf, rg, estado_civil) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          nome,
          data_nascimento,
          endereco || null,
          status,
          numero || null,
          email || null,
          cpf || null,
          rg || null,
          estado_civil || null,
        ],
      );

      const [rows] = await connection.execute("SELECT * FROM membros");

      return res.status(201).json({ membros: rows });
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      return res
        .status(500)
        .json({ message: "Erro ao adicionar membro", error });
    }
  });
}
