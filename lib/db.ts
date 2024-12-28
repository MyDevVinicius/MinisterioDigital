import mysql from "mysql2/promise";

// Cache de pools de conexão para clientes
const clientPools: { [key: string]: mysql.Pool } = {};

// Pool de conexão para o banco admin_db (usado para a autenticação do cliente)
let pool: mysql.Pool;

// Função para obter o pool de conexões do admin_db
export function getAdminConnectionPool() {
  if (!pool) {
    // Exibindo as variáveis de ambiente para depuração (somente em desenvolvimento)
    if (process.env.NODE_ENV !== "production") {
      console.log(
        "Conectando ao banco de dados com as seguintes configurações:",
      );
      console.log("Host:", process.env.DB_HOST);
      console.log("Usuário:", process.env.DB_USER);
      console.log(
        "Senha:",
        process.env.DB_PASSWORD ? "********" : "Não definida",
      );
      console.log("Banco de dados:", process.env.DB_ADMIN_DB);
    }

    pool = mysql.createPool({
      host: process.env.DB_HOST, // Usando variável de ambiente
      user: process.env.DB_USER, // Usando variável de ambiente
      password: process.env.DB_PASSWORD, // Usando variável de ambiente
      database: process.env.DB_ADMIN_DB, // Usando variável de ambiente
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return pool;
}

// Função para obter uma conexão do pool para o banco admin_db
export async function getAdminConnection() {
  const pool = getAdminConnectionPool();
  return await pool.getConnection(); // Retorna uma conexão do pool
}

// Função para obter o pool de conexão específico para o banco do cliente
export async function getClientConnectionPool(nome_banco: string) {
  if (!clientPools[nome_banco]) {
    // Exibindo o nome do banco do cliente para depuração
    console.log("Criando pool para o banco do cliente:", nome_banco);

    // Cria o pool específico para o banco do cliente
    clientPools[nome_banco] = mysql.createPool({
      host: process.env.DB_HOST, // Usando variável de ambiente
      user: process.env.DB_USER, // Usando variável de ambiente
      password: process.env.DB_PASSWORD, // Usando variável de ambiente
      database: nome_banco, // O nome do banco do cliente
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }
  return clientPools[nome_banco];
}

// Função para obter uma conexão do pool específico do banco do cliente
export async function getClientConnection(nome_banco: string) {
  const clientPool = await getClientConnectionPool(nome_banco);
  return await clientPool.getConnection(); // Retorna uma conexão do pool
}
