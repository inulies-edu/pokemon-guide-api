// 1. Importar as bibliotecas (mesma coisa)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const userRoutes = require('./routes/userRoutes'); 
const dataRoutes = require('./routes/dataRoutes'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 4000; 

app.use(cors()); 
app.use(express.json()); 

app.get('/', (req, res) => {
  res.send('API do Guia Pokémon FireRed está no ar!');
});

app.use('/api/users', userRoutes);
app.use('/api/data', dataRoutes);

const startServer = async () => {
  try {
    const dbURI = process.env.MONGO_URI; 
    await mongoose.connect(dbURI);
    
    console.log('✅ Conectado ao MongoDB Atlas!');
    app.listen(PORT, () => {
      console.log(`🚀 Servidor rodando na porta ${PORT}`);
    });

  } catch (err) {
    console.error('❌ Erro ao conectar ao MongoDB:', err.message);
  }
};

startServer();