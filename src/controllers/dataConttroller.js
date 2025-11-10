// src/controllers/dataController.js
const Pokemon = require('../models/Pokemon');

// Dados dos 3 iniciais (com Level 5 e moves)
const starters = [
  {
    _id: 1, // ID Nacional
    name: 'Bulbasaur',
    type: ['Grass', 'Poison'],
    baseStats: { hp: 45, attack: 49, defense: 49, spAttack: 65, spDefense: 65, speed: 45 },
    starterInfo: {
      level: 5,
      moves: ['Tackle', 'Growl']
    }
  },
  {
    _id: 4,
    name: 'Charmander',
    type: ['Fire'],
    baseStats: { hp: 39, attack: 52, defense: 43, spAttack: 60, spDefense: 50, speed: 65 },
    starterInfo: {
      level: 5,
      moves: ['Scratch', 'Growl']
    }
  },
  {
    _id: 7,
    name: 'Squirtle',
    type: ['Water'],
    baseStats: { hp: 44, attack: 48, defense: 65, spAttack: 50, spDefense: 64, speed: 43 },
    starterInfo: {
      level: 5,
      moves: ['Tackle', 'Tail Whip']
    }
  }
];

// Função para "semear" (seed) os dados no banco
exports.seedPokemonData = async (req, res) => {
  try {
    // 2. Mude PokemonData para Pokemon
    await Pokemon.deleteMany({});
    
    // 3. Mude PokemonData para Pokemon
    await Pokemon.insertMany(starters);
    
    res.status(201).json({ message: 'Dados dos Pokémon iniciais semeados com sucesso!' });
  } catch (error) {
    res.status(500).json({ message: 'Erro ao semear dados', error: error.message });
  }
};