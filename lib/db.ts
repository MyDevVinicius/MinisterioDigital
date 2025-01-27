import mysql from "mysql2/promise";

// Cache de pools de conexão para clientes
const clientPools: { [key: string]: mysql.Pool } = {};

// Pool de conexão para o banco admin_db (usado para a autenticação do cliente)
let pool: mysql.Pool | undefined;

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
      connectionLimit: 10,   // Limitar o número de conexões simultâneas
      queueLimit: 0,          // Número de conexões na fila antes de rejeitar
      acquireTimeout: 10000,  // Timeout para aquisição de uma conexão
    });
  }
  return pool;
}

// Função para obter uma conexão do pool para o banco admin_db
export async function getAdminConnection() {
  const pool = getAdminConnectionPool();
  const connection = await pool.getConnection();
  try {
    return connection;
  } finally {
    connection.release();  // Liberando a conexão após o uso
  }
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
      connectionLimit: 10,   // Limite de conexões simultâneas
      queueLimit: 0,          // Número de conexões na fila antes de rejeitar
      acquireTimeout: 10000,  // Timeout para aquisição de uma conexão
    });
  }
  return clientPools[nome_banco];
}

// Função para obter uma conexão do pool específico do banco do cliente
export async function getClientConnection(nome_banco: string) {
  const clientPool = await getClientConnectionPool(nome_banco);
  const connection = await clientPool.getConnection();
  try {
    return connection;
  } finally {
    connection.release();  // Liberando a conexão após o uso
  }
}

// Função para fechar a conexão com o banco admin_db
export async function closeAdminConnection() {
  if (pool) {
    await pool.end();
    pool = undefined;
    console.log("Conexão com o admin_db encerrada.");
  }
}

// Função para fechar todas as conexões dos bancos dos clientes
export async function closeAllClientConnections() {
  for (const nome_banco in clientPools) {
    if (clientPools[nome_banco]) {
      await clientPools[nome_banco].end();
      delete clientPools[nome_banco];
      console.log(`Conexão com o banco ${nome_banco} encerrada.`);
    }
  }
}

// Função para monitorar o uso de conexões e ajustar a configuração
export async function monitorConnections() {
  // Verificando o número de conexões ativas
  const pool = getAdminConnectionPool();
  const [rows] = await pool.query("SHOW STATUS LIKE 'Threads_connected'");
  const activeConnections = parseInt((rows as any)[0]?.Value, 10);

  if (activeConnections > pool.config.connectionLimit) {
    console.warn(`Número de conexões ativas excedeu o limite! Ativas: ${activeConnections}`);
  }
}
