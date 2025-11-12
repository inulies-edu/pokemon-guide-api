// src/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// --- Sub-schema para Itens (reutilizável) ---
const InventoryItemSchema = new Schema({
  id: { type: Number, required: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

// --- Sub-schema para Aparência (Perfil) ---
const AppearanceSchema = new Schema({
  hatStyle: { type: String, default: '0' },
  jacketStyle: { type: String, default: '0' },
  pantsStyle: { type: String, default: '0' },
  shoeStyle: { type: String, default: '0' }
}, { _id: false });

// --- Sub-schema para Perfil Social (Novo) ---
const ProfileSchema = new Schema({
  bio: { type: String, maxLength: 150, default: 'Novo Treinador!' },
  avatarUrl: { type: String, default: 'default_avatar.png' },
  appearance: { type: AppearanceSchema, default: () => ({}) }
}, { _id: false });

// --- Sub-schema para Lista de Amigos (Novo) ---
const FriendSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  username: { type: String, required: true },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'blocked'],
    default: 'pending'
  },
  since: { type: Date }
});

// --- Sub-schema para Pokémon do Jogador (O Monstro!) ---
const PlayerPokemonSchema = new Schema({
  storageLocation: {
    type: { type: String, enum: ['party', 'box'], required: true },
    box: { type: Number, default: null },
    slot: { type: Number, required: true }
  },
  speciesId: { type: Number, required: true },
  speciesName: { type: String, required: true },
  nickname: { type: String },
  level: { type: Number, default: 1 },
  isShiny: { type: Boolean, default: false },
  gender: { type: String, enum: ['Male', 'Female', 'Genderless'] },
  ability: {
    id: Number,
    name: String
  },
  nature: { type: String },
  heldItem: {
    id: Number,
    name: String
  },
  metData: {
    metLocation: String,
    metLevel: Number,
    ball: String
  },
  stats: {
    ivs: { hp: Number, atk: Number, def: Number, spa: Number, spd: Number, spe: Number },
    evs: { hp: Number, atk: Number, def: Number, spa: Number, spd: Number, spe: Number },
    total: { hp: Number, atk: Number, def: Number, spa: Number, spd: Number, spe: Number }
  },
  moves: [
    { id: Number, name: String, _id: false }
  ],
  originalTrainer: {
    name: String,
    gender: String
  }
}, { _id: false });


// --- Sub-schema para o NOVO SaveData (Baseado no .sav) ---
const SaveDataSchema = new Schema({
  lastUploaded: { type: Date, default: Date.now },
  saveLoaded: { type: Boolean, default: false }, // Flag para .sav
  playerInfo: {
    playerName: { type: String, default: 'Red' },
    trainerId: { type: Number, default: 0 },
    secretId: { type: Number, default: 0 },
    gender: { type: String, default: 'Male' },
    money: { type: Number, default: 3000 },
    timePlayed: {
      hours: { type: Number, default: 0 },
      minutes: { type: Number, default: 0 },
      seconds: { type: Number, default: 0 }
    },
    gameInfo: {
      gameVersion: String,
      generation: String
    },
    secretBase: {
      locationName: String,
      locationID: Number
    }
  },
  progress: {
    badges: { // Estrutura de objeto é melhor que array!
      Boulder: { type: Boolean, default: false },
      Cascade: { type: Boolean, default: false },
      Thunder: { type: Boolean, default: false },
      Rainbow: { type: Boolean, default: false },
      Soul: { type: Boolean, default: false },
      Marsh: { type: Boolean, default: false },
      Volcano: { type: Boolean, default: false },
      Earth: { type: Boolean, default: false }
    },
    pokedex: {
      seen: [Number],
      caught: [Number]
    },
    gameCoins: { type: Number, default: 0 },
    hallOfFameEntries: { type: Array, default: [] }
  },
  inventory: {
    items: [InventoryItemSchema],
    keyItems: [InventoryItemSchema],
    balls: [InventoryItemSchema],
    tmHms: [InventoryItemSchema],
    berries: [InventoryItemSchema]
  },
  pc: {
    boxNames: [String],
    pcItems: [InventoryItemSchema]
  },
  // --- Estrutura agrupada (Sua ideia) ---
  pokemon: {
    party: [PlayerPokemonSchema],
    box: [PlayerPokemonSchema]
  }
});


// --- O Schema Principal do Usuário (O Molde Final) ---
const UserSchema = new Schema({
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/.+\@.+\..+/, 'Please fill a valid email address']
  },
  password: { // Mantido como 'password'
    type: String,
    required: [true, 'Password is required']
  },
  profile: {
    type: ProfileSchema,
    default: () => ({})
  },
  friendsList: [FriendSchema],

  saveData: {
    type: SaveDataSchema,
    default: () => ({}) // Inicia como um objeto vazio por padrão
  }
}, {
  timestamps: true // Adiciona 'createdAt' e 'updatedAt'
});

module.exports = mongoose.model('User', UserSchema);