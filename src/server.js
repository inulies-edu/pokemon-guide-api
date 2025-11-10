// 1. Importar as bibliotecas (mesma coisa)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); 
const dataRoutes = require('./routes/dataRoutes'); 
require('dotenv').config();

// 2. Inicializar o Express (mesma coisa)
const app = express();
const PORT = process.env.PORT || 4000; 

// 3. Configurar Middlewares (mesma coisa)
app.use(cors()); 
app.use(express.json()); 

// 4. Rota de Teste (pode ficar aqui)
app.get('/', (req, res) => {
  res.send('API do Guia Pokémon FireRed está no ar!');
});

// Usando as rotas
// Diz ao express para user o 'userRoutes' para qualquer rota que comece com '/api/users'
app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);

// 5. NOVA LÓGICA DE STARTUP (A Mágica está aqui)
const startServer = async () => {
  try {
    // Pega a string do .env
    const dbURI = process.env.MONGO_URI; 
    
    // Tenta conectar ao MongoDB (e ESPERA)
    await mongoose.connect(dbURI);
    
    // Se a linha de cima funcionar, loga e inicia o servidor
    console.log('✅ Conectado ao MongoDB Atlas!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  } catch (err) {
    // Se a linha 'await mongoose.connect' falhar, entra aqui
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
    // process.exit(1); 
  }
};

// 6. Chamar a função para iniciar tudo
startServer();