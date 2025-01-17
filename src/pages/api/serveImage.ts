import { NextApiRequest, NextApiResponse } from "next";
import path from "path";
import fs from "fs";
import mime from "mime-types"; // Para determinar o tipo MIME da imagem automaticamente

export default (req: NextApiRequest, res: NextApiResponse) => {
  const { filename } = req.query;

  // Verifique se o 'filename' foi passado como query parameter
  if (!filename || Array.isArray(filename)) {
    return res.status(400).send("Nome de arquivo inválido.");
  }

  // Defina o caminho completo do arquivo com base no diretório público
  const filePath = path.join(process.cwd(), "public", "images", filename);

  // Verificar se o arquivo existe no diretório
  if (fs.existsSync(filePath)) {
    // Determina o tipo MIME do arquivo com base na extensão
    const mimeType = mime.lookup(filePath) || "application/octet-stream";

    // Definir o cabeçalho Content-Type para o tipo de mídia correto
    res.setHeader("Content-Type", mimeType);

    // Criar o stream de leitura do arquivo e "pipe" para a resposta
    const file = fs.createReadStream(filePath);
    file.pipe(res);
  } else {
    // Retornar 404 se o arquivo não for encontrado
    res.status(404).send("Imagem não encontrada");
  }
};

};
