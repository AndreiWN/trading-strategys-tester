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

// Configuração do MySQL
const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'trading_strategys',
  typeCast: function (field, next) {
    if (field.type === 'BLOB' || field.type === 'TEXT') {
      return field.string();
    }
    return next();
  }
});

// Conectar ao banco de dados
connection.connect(error => {
  if (error) {
    console.error('Erro ao conectar ao banco de dados:', error);
    return;
  }
  console.log('Conectado ao banco de dados MySQL com sucesso!');
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

// Endpoint para criar nova estratégia (Backtest)
app.post('/api/backtest', (req, res) => {
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

  connection.query(
    query,
    [
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
    ],
    (error, results) => {
      if (error) {
        console.error('Erro ao inserir estratégia:', error);
        res.status(500).json({ error: 'Erro ao salvar estratégia' });
        return;
      }
      res.status(201).json({ message: 'Estratégia salva com sucesso', id: results.insertId });
    }
  );
});

// Endpoint para buscar todas as estratégias (Backtest)
app.get('/api/backtest', (req, res) => {
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
  
  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erro ao buscar estratégias:', error);
      res.status(500).json({ error: 'Erro ao buscar estratégias' });
      return;
    }

    res.status(200).json(results);
  });
});

// Endpoint para excluir uma estratégia (Backtest)
app.delete('/api/backtest/:id', (req, res) => {
  const id = req.params.id;
  const query = 'DELETE FROM backtest WHERE id = ?';
  
  connection.query(query, [id], (error, results) => {
    if (error) {
      console.error('Erro ao excluir estratégia:', error);
      res.status(500).json({ error: 'Erro ao excluir estratégia' });
      return;
    }
    res.status(200).json({ message: 'Estratégia excluída com sucesso' });
  });
});

app.post('/api/upload/strategies', (req, res) => {
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
  connection.query(insertQuery, [strategy_name, strategy_ex_file, strategy_mq_file], (insertError) => {
    if (insertError) {
      console.error('Erro ao salvar estratégia:', insertError);
      return res.status(500).json({ error: 'Erro ao salvar estratégia' });
    }
    res.status(201).json({ message: 'Estratégia salva com sucesso' });
  });
});

// Endpoint para buscar todas as estratégias
app.get('/api/strategies', (req, res) => {
  const query = `
    SELECT 
      *
    FROM strategies
    ORDER BY id DESC
  `;

  connection.query(query, (error, results) => {
    if (error) {
      console.error('Erro ao buscar estratégias:', error);
      return res.status(500).json({ error: 'Erro ao buscar estratégias' });
    }
    res.status(200).json(results);
  });
});

// Endpoint para excluir uma estratégia
app.delete('/api/strategies/:id', (req, res) => {
  const { id } = req.params;
  const query = 'DELETE FROM strategies WHERE id = ?';

  connection.query(query, [id], (error) => {
    if (error) {
      console.error('Erro ao excluir estratégia:', error);
      return res.status(500).json({ error: 'Erro ao excluir estratégia' });
    }
    res.status(200).json({ message: 'Estratégia excluída com sucesso' });
  });
});

// Iniciar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});
