const mongoose = require('mongoose');
const Schema = mongoose.Schema;


// Defines the structure for a Pokémon in the party or PC
const PokemonSchema = new Schema({
  pokemonId: { type: Number, required: true }, // National Dex ID (e.g., 25 for Pikachu)
  nickname: { type: String },
  level: { type: Number, default: 1 },
  moves: [{ type: String }],
  // ...you can add more fields like currentHP, stats, etc., later
}, { _id: false }); // _id: false prevents Mongoose from creating sub-document IDs

// Defines the structure for an item in the inventory
const ItemSchema = new Schema({
  itemId: { type: String, required: true }, // e.g., "pokeball"
  name: { type: String, required: true }, // e.g., "Poké Ball"
  quantity: { type: Number, default: 1 }
}, { _id: false });

// Defines the structure for badges
const BadgeSchema = new Schema({
  name: { type: String, required: true },
  acquired: { type: Boolean, default: false }
}, { _id: false });


// --- The Main User Schema ---

const UserSchema = new Schema({
  // --- Auth Data ---
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true, // Ensures no two users have the same username
    lowercase: true,
    trim: true // Removes whitespace from ends
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    // We won't save the plain password, bcrypt will handle this in the controller
  },

  // --- Game Data (The "Save File") ---
  saveData: {
    playerName: { type: String, default: 'Red' },
    money: { type: Number, default: 3000 },
    currentLocation: { type: String, default: 'pallet_town' },
    
    badges: [BadgeSchema], // Array using the sub-schema
    
    party: [PokemonSchema], // Array of Pokémon
    
    inventory: [ItemSchema], // Array of Items

    pcBox: [PokemonSchema], // Array of Pokémon (in the PC)

    pokedexSeen: [{ type: Number }], // Array of IDs (e.g., [1, 2, 4, 7])
    pokedexCaught: [{ type: Number }]
  }
}, {
  timestamps: true // Adds 'createdAt' and 'updatedAt' automatically
});

// Export the "Model"
// Mongoose will create a collection named "users" (plural, lowercase)
module.exports = mongoose.model('User', UserSchema);