const express = require('express');
const cors = require('cors');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Ajuste conforme necessário
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Configuração do MySQL com Pool de Conexões
const mysql = require('mysql2');

// Criação do pool de conexões
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'srv1660.hstgr.io',
  user: process.env.DB_USER || 'u901187236_root',
  password: process.env.DB_PASSWORD || '55245524@Andrei',
  database: process.env.DB_NAME || 'u901187236_trading',
  waitForConnections: true,
  connectionLimit: 1000, // Ajuste conforme necessário
  queueLimit: 0,
  typeCast: function (field, next) {
    if (field.type === 'BLOB' || field.type === 'TEXT') {
      return field.string();
    }
    return next();
  }
});

// Verificar conexão com o banco de dados
pool.getConnection((err, connection) => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err);
    // Você pode optar por encerrar a aplicação se a conexão falhar
    process.exit(1);
  }
  console.log('Conectado ao banco de dados MySQL com sucesso!');
  connection.release();
});

// Diretório para salvar os uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Rota de teste
app.get('/', (req, res) => {
  res.json({ message: 'Backend está funcionando!' });
});

// Função auxiliar para executar consultas com pool
const executeQuery = (query, params = []) => {
  return new Promise((resolve, reject) => {
    pool.execute(query, params, (error, results) => {
      if (error) {
        return reject(error);
      }
      resolve(results);
    });
  });
};

// Endpoint para criar nova estratégia (Backtest)
app.post('/api/backtest', async (req, res) => {
  try {
    const {
      symbol,
      symbol_type,
      strategy_name,
      period_test,
      total_trades,
      profit_factor,
      sharpe_ratio,
      recovery_factor,
      win_rate,
      set_file,
      capital_curve
    } = req.body;

    const query = `
      INSERT INTO backtest (
        symbol,
        period_test,
        total_trades,
        profit_factor,
        sharpe_ratio,
        recovery_factor,
        win_rate,
        set_file,
        capital_curve,
        symbol_type,
        strategy_name
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      symbol,
      period_test,
      total_trades,
      profit_factor,
      sharpe_ratio,
      recovery_factor,
      win_rate,
      set_file,
      capital_curve,
      symbol_type,
      strategy_name
    ]);

    res.status(201).json({ message: 'Estratégia salva com sucesso', id: result.insertId });
  } catch (error) {
    console.error('Erro ao inserir estratégia:', error);
    res.status(500).json({ error: 'Erro ao salvar estratégia' });
  }
});

// Endpoint para buscar todas as estratégias (Backtest)
app.get('/api/backtest', async (req, res) => {
  try {
    const query = `
      SELECT 
        id, 
        symbol, 
        symbol_type, 
        strategy_name, 
        period_test, 
        total_trades, 
        profit_factor, 
        sharpe_ratio, 
        recovery_factor, 
        win_rate, 
        set_file, 
        CAST(capital_curve AS CHAR) as capital_curve 
      FROM backtest 
      ORDER BY id DESC
    `;

    const results = await executeQuery(query);
    res.status(200).json(results);
  } catch (error) {
    console.error('Erro ao buscar estratégias:', error);
    res.status(500).json({ error: 'Erro ao buscar estratégias' });
  }
});

// Endpoint para excluir uma estratégia (Backtest)
app.delete('/api/backtest/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const query = 'DELETE FROM backtest WHERE id = ?';

    const result = await executeQuery(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estratégia não encontrada' });
    }

    res.status(200).json({ message: 'Estratégia excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir estratégia:', error);
    res.status(500).json({ error: 'Erro ao excluir estratégia' });
  }
});

// Endpoint para editar backtest
app.put('/api/backtest/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const {
      symbol,
      symbol_type,
      strategy_name,
      period_test,
      total_trades,
      profit_factor,
      sharpe_ratio,
      recovery_factor,
      win_rate,
      set_file,
      capital_curve
    } = req.body;

    const query = `
      UPDATE backtest 
      SET symbol = ?,
          symbol_type = ?,
          strategy_name = ?,
          period_test = ?,
          total_trades = ?,
          profit_factor = ?,
          sharpe_ratio = ?,
          recovery_factor = ?,
          win_rate = ?,
          set_file = ?,
          capital_curve = ?
      WHERE id = ?
    `;

    const result = await executeQuery(query, [
      symbol,
      symbol_type,
      strategy_name,
      period_test,
      total_trades,
      profit_factor,
      sharpe_ratio,
      recovery_factor,
      win_rate,
      set_file,
      capital_curve,
      id
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estratégia não encontrada' });
    }

    res.status(200).json({ message: 'Estratégia atualizada com sucesso' });
  } catch (error) {
    console.error('Erro ao atualizar estratégia:', error);
    res.status(500).json({ error: 'Erro ao atualizar estratégia' });
  }
});

// Endpoint para salvar estratégias (Upload)
app.post('/api/upload/strategies', async (req, res) => {
  try {
    const { strategy_name, strategy_ex_file, strategy_mq_file } = req.body;

    // Validação dos dados recebidos
    if (!strategy_ex_file || !strategy_mq_file) {
      return res.status(400).json({ error: 'Dados incompletos. Por favor, forneça strategy_ex_file e strategy_mq_file.' });
    }

    // Inserir a nova estratégia
    const insertQuery = `
      INSERT INTO strategies (
        strategy_name,
        strategy_ex_file, 
        strategy_mq_file
      ) VALUES (?, ?, ? )
    `;
    await executeQuery(insertQuery, [strategy_name, strategy_ex_file, strategy_mq_file]);

    res.status(201).json({ message: 'Estratégia salva com sucesso' });
  } catch (error) {
    console.error('Erro ao salvar estratégia:', error);
    res.status(500).json({ error: 'Erro ao salvar estratégia' });
  }
});

// Endpoint para buscar todas as estratégias
app.get('/api/strategies', async (req, res) => {
  try {
    const query = `
      SELECT 
        *
      FROM strategies
      ORDER BY strategy_name
    `;

    const results = await executeQuery(query);
    res.status(200).json(results);
  } catch (error) {
    console.error('Erro ao buscar estratégias:', error);
    res.status(500).json({ error: 'Erro ao buscar estratégias' });
  }
});

// Endpoint para excluir uma estratégia
app.delete('/api/strategies/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = 'DELETE FROM strategies WHERE id = ?';

    const result = await executeQuery(query, [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Estratégia não encontrada' });
    }

    res.status(200).json({ message: 'Estratégia excluída com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir estratégia:', error);
    res.status(500).json({ error: 'Erro ao excluir estratégia' });
  }
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
