const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Vamos precisar para achar o usuário

const authMiddleware = async (req, res, next) => {
  let token;

  // 1. O token geralmente vem no cabeçalho "Authorization"
  // e tem o formato "Bearer <token>"
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // 2. Pega o token (tirando o "Bearer ")
      token = req.headers.authorization.split(' ')[1];

      // 3. Verifica se o token é válido usando o nosso segredo
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // 4. Se for válido, o 'decoded' terá o payload (nosso { user: { id: ... } })
      // Nós "anexamos" os dados do usuário na própria requisição (req)
      // para que o próximo passo (o Controller) possa usá-los.
      // O .select('-password') remove a senha do que é retornado
      req.user = await User.findById(decoded.user.id).select('-password');

      // 5. Deixa a requisição continuar para o Controller
      next();

    } catch (error) {
      // Se o token for inválido (expirado, assinatura errada, etc.)
      res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // Se não houver token ou não começar com "Bearer"
  if (!token) {
    res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = authMiddleware;