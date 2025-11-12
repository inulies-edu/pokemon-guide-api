// test-parser.js
// Usamos 'require' aqui porque nosso projeto é CommonJS
const fs = require('fs').promises;
const path = require('path');

const ARQUIVO_SAVE = 'pokemon.sav'; 

async function runTest() {
  console.log('🔥 Iniciando teste do Save Parser...');

  // 1. Carrega o serviço (ESM) de forma dinâmica
  let parseSaveBuffer;
  try {
    // Usamos import() dinâmico para carregar um módulo ES (o seu service)
    // dentro de um script CommonJS (o nosso teste)
    const serviceModule = await import('./src/services/saveParserService.js');
    parseSaveBuffer = serviceModule.parseSaveBuffer;
  } catch (err) {
    console.error('❌ Falha ao carregar o saveParserService.js!', err);
    console.log('Dica: Veja se o arquivo existe e se o "pkhex" está instalado.');
    return;
  }

  // 2. Lê o arquivo .sav do disco
  const saveFilePath = path.resolve(__dirname, ARQUIVO_SAVE);
  let saveBuffer;
  try {
    saveBuffer = await fs.readFile(saveFilePath);
    console.log(`Arquivo "${ARQUIVO_SAVE}" lido com sucesso.`);
  } catch (err) {
    console.error(`❌ Erro ao ler o arquivo: "${ARQUIVO_SAVE}"`);
    console.error('Verifique se o arquivo .sav está na raiz do projeto.');
    return;
  }

  console.log('Enviando buffer para o PKHeX...');
  try {
    const jsonData = await parseSaveBuffer(saveBuffer);
    
    console.log('✅ SUCESSO! Parseamento concluído.');
    console.log('--- Objeto SaveData Formatado (pronto para o banco) ---');
    
    console.log(JSON.stringify(jsonData, null, 2));

  } catch (err) {
    console.error('❌ O PARSER FALHOU:');
    console.error(err);
  }
}

runTest();