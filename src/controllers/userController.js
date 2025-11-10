const User = require('../models/User'); // Importa o Model que acabamos de criar
const bcrypt = require('bcryptjs'); // Importa o bcrypt para hashear a senha
const jwt = require('jsonwebtoken');
const Pokemon = require('../models/Pokemon');

// Controller function to register a new user
exports.registerUser = async (req, res) => {
  try {
    // 1. Pega o username e password do corpo da requisição (o JSON)
    const { username, password } = req.body;

    // 2. Validação simples (o Mongoose já faz a maioria)
    if (!username || !password) {
      return res.status(400).json({ message: 'Please provide username and password' });
    }

    // 3. Checa se o usuário já existe
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already taken' });
    }

    // 4. Criptografar (hash) a senha
    // "salt" é um fator de aleatoriedade para o hash
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 5. Criar o novo usuário com os dados iniciais do Pokémon FireRed
    const newUser = new User({
      username: username,
      password: hashedPassword,
      // O Mongoose vai preencher 'saveData' com os valores 'default'
      // que definimos no Schema (playerName: 'Red', money: 3000, etc.)
    });

    // 6. Salvar o usuário no banco
    const savedUser = await newUser.save();
    
    // 7. Responder ao front-end (SEM enviar a senha de volta!)
    res.status(201).json({
      message: 'User registered successfully!',
      user: {
        id: savedUser._id,
        username: savedUser.username,
        saveData: savedUser.saveData 
      }
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.loginUser = async (req, res) => {
  try {
    // 1. Pega o username e password do corpo
    const { username, password } = req.body;

    // 2. Acha o usuário no banco
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials (user)' });
    }

    // 3. Compara a senha enviada com a senha "hasheada" do banco
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials (password)' });
    }

    // 4. Se tudo deu certo, criar o "Crachá" (Token)
    // O "payload" é a informação que queremos guardar no token
    const payload = {
      user: {
        id: user._id, // Salva o ID do usuário no token
        username: user.username
      }
    };

    // 5. Assinar o token e enviar de volta
    jwt.sign(
      payload,
      process.env.JWT_SECRET, // Usa o segredo do .env
      { expiresIn: '30d' },    // Token expira em 30 dias
      (err, token) => {
        if (err) throw err;
        // Envia o token para o front-end!
        res.status(200).json({
          message: 'Logged in successfully!',
          token: token,
          userId: user._id
        });
      }
    );

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.getMyProfile = async (req, res) => {
  try {
    // Graças ao middleware, o 'req.user' já existe!
    // O middleware já pegou o token, validou e buscou o usuário no banco.
    // Nós só precisamos enviar de volta.
    if (req.user) {
      res.status(200).json(req.user);
    } else {
      res.status(404).json({ message: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

exports.setupCharacter = async (req, res) => {
  try {
    const { playerName, starterId } = req.body;
    const userId = req.user.id;
    // ... (validações de entrada) ...
    // ... (checar se o setup já foi feito) ...

    // 5. AGORA VEM A MÁGICA: Buscar os dados base
    const starterBaseData = await Pokemon.findById(starterId);

    if (!starterBaseData) {
      return res.status(404).json({ message: 'Dados base do Pokémon inicial não encontrados' });
    }

    // 6. Construir o Pokémon do *jogador* usando os dados base
    const initialStarter = {
      pokemonId: starterBaseData._id,
      level: starterBaseData.starterInfo.level, // Puxado do banco
      moves: starterBaseData.starterInfo.moves  // Puxado do banco
      //nickname: starterBaseData.name (opcional)
    };
    
    // ... (o resto é igual: definir rival, criar initialSaveData) ...
    const initialSaveData = {
        playerName: playerName,
        money: 3000,
        currentLocation: 'pallet_town',
        party: [initialStarter], // Agora usa o objeto que acabamos de construir
        inventory: [
            { itemId: 'potion', name: 'Potion', quantity: 5 }
        ],
        pokedexSeen: [1, 2, 3, 4, 5, 6, 7, 8, 9],
        pokedexCaught: [starterId]
    };

    // 7. Atualizar o usuário no banco
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $set: { saveData: initialSaveData } },
      { new: true }
    ).select('-password');

    res.status(200).json({
      message: 'Character setup successful!',
      user: updatedUser
    });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

