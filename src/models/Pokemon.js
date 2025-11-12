// src/models/Pokemon.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PokemonSchema = new Schema({
  _id: {
    type: Number,
    required: true,
  },
  name: {
    type: String,
    required: true,
    unique: true
  },
  
  type: [{ type: String }],
  
  baseStats: {
    hp: Number,
    attack: Number,
    defense: Number,
    spAttack: Number,
    spDefense: Number,
    speed: Number
  },
  
  starterInfo: {
    level: { type: Number, default: 5 },
    moves: [{ type: String }]
  }
});

PokemonSchema.set('versionKey', false);

module.exports = mongoose.model('Pokemon', PokemonSchema);