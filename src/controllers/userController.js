const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// Não precisamos mais do 'Pokemon' (model estático) aqui por enquanto

// --- 1. registerUser (Refatorado) ---
// Agora também inclui 'email' e não retorna o saveData
exports.registerUser = async (req, res) => {
  try {
    // 1. Pega os 3 campos do corpo
    const { username, email, password } = req.body;

    // 2. Validação de entrada
    if (!username || !email || !password) {
      return res.status(400).json({ message: 'Por favor, forneça username, email e senha' });
    }

    // 3. Checa se o usuário OU email já existem
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Este username já está em uso' });
    }
    
    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: 'Este email já está em uso' });
    }

    // 4. Criptografar (hash) a senha
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Criar o novo usuário
    // Note que só passamos os campos principais.
    // Os defaults (profile, saveData) serão criados pelo Mongoose.
    const newUser = new User({
      username: username,
      email: email,
      password: hashedPassword,
    });

    // 6. Salvar o usuário no banco
    await newUser.save();
    
    // 7. Responder (sem dados sensíveis)
    res.status(201).json({
      message: 'Usuário registrado com sucesso!',
    });

  } catch (error) {
    // Trata erros de validação do Mongoose (ex: email inválido)
    if (error.name === 'ValidationError') {
        return res.status(400).json({ message: error.message });
    }
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- 2. loginUser (Sem grandes mudanças) ---
// A lógica central é a mesma
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ message: 'Por favor, forneça username e senha' });
    }

    // 1. Acha o usuário no banco
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // 2. Compara a senha (o campo agora é 'password', como você definiu)
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciais inválidas' });
    }

    // 3. Criar o Token
    const payload = {
      user: {
        id: user._id,
        username: user.username
      }
    };

    // 4. Assinar o token e enviar de volta
    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '30d' },
      (err, token) => {
        if (err) throw err;
        res.status(200).json({
          message: 'Login bem-sucedido!',
          token: token,
          userId: user._id
        });
      }
    );

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- 3. getMyProfile (Sem mudanças) ---
// O authMiddleware já faz o trabalho de buscar o usuário
exports.getMyProfile = async (req, res) => {
  try {
    // req.user é populado pelo authMiddleware
    if (req.user) {
      res.status(200).json(req.user);
    } else {
      res.status(404).json({ message: 'Usuário não encontrado' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- 4. getHallOfFame (Refatorado) ---
// Atualizado para os novos campos do 'saveData' e 'profile'
exports.getHallOfFame = async (req, res) => {
  try {
    // Busca todos os usuários, mas só retorna dados públicos
    const trainers = await User.find({})
      .select('username profile.avatarUrl profile.bio saveData.playerInfo.playerName saveData.progress.badges saveData.saveLoaded');

    // Filtra usuários que já carregaram um save
    const activeTrainers = trainers.filter(t => t.saveData && t.saveData.saveLoaded === true);
    
    res.status(200).json(activeTrainers);
  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// --- 5. getUserProfile (Refatorado) ---
// Atualizado para os novos filtros
exports.getUserProfile = async (req, res) => {
  try {
    const username = req.params.username.toLowerCase();
    
    const user = await User.findOne({ username: username })
      .select('-password -__v -updatedAt'); // Esconde senha, etc.

    // Checa se o usuário existe e se já carregou um save
    if (!user || !user.saveData.saveLoaded) {
      return res.status(404).json({ message: 'Treinador não encontrado ou não configurado.' });
    }

    res.status(200).json(user);

  } catch (error) {
    res.status(500).json({ message: 'Erro no servidor', error: error.message });
  }
};

// NOTA: A função 'setupCharacter' foi REMOVIDA.
// Ela será substituída por uma nova função 'uploadSaveFile'.