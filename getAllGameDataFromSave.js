import setupPKHeX from 'pkhex';
import { readFile } from 'fs/promises';
import path from 'path';

/**
 * Função "Helper" para chamar a API com segurança.
 * Previne que uma chamada com erro (ex: de outra geração) quebre o script.
 */
async function safeCall(apiFunction, handle, ...args) {
  try {
    const result = await apiFunction(handle, ...args);
    
    // Se a API retornar um erro (ex: { error: "..." }), capturamos
    if (result && result.error) {
      return { success: false, error: result.error };
    }
    
    // Se for sucesso, retornamos o dado
    return { success: true, data: result };
    
  } catch (e) {
    // Se a API quebrar (ex: função não existe na implementação)
    return { success: false, error: e.message };
  }
}

/**
 * Função especial para pegar os detalhes dos Pokémon,
 * já que ela é mais complexa (Party + PC).
 */
async function getPokemonData(pkhex, handle) {
  try {
    const partySummaries = await pkhex.save.pokemon.getParty(handle); 
    const pcSummaries = await pkhex.save.pokemon.getAll(handle); 

    if (!Array.isArray(pcSummaries) || !Array.isArray(partySummaries)) {
      return { success: false, error: "Falha ao ler sumários de PC ou Party." };
    }

    const pokemonSummaries = partySummaries.concat(pcSummaries);
    const allPokemonDetails = [];
    
    for (const summary of pokemonSummaries) {
        if (summary.species > 0) {
            let detailResult; 
            if (summary.box < 0) { // Pokémon da Party
                detailResult = await pkhex.save.pokemon.getPartySlot(handle, summary.slot);
            } else { // Pokémon do PC
                detailResult = await pkhex.save.pokemon.get(handle, summary.box, summary.slot);
            }

            if (!detailResult.error) {
                 allPokemonDetails.push(detailResult);
            }
        }
    }
    return { success: true, data: allPokemonDetails };
  } catch (e) {
    return { success: false, error: e.message };
  }
}


/**
 * Função Principal - LÊ TUDO
 */
async function lerTudoDoSave(caminhoDoArquivo) {
  const masterData = {}; // Objeto mestre para guardar TUDO
  let pkhex, handle;

  try {
    // 1. Carregar o Save
    console.log('Iniciando a API do PKHeX.js...');
    pkhex = await setupPKHeX();

    console.log(`Lendo o arquivo: ${caminhoDoArquivo}`);
    const saveDataBuffer = await readFile(caminhoDoArquivo);
    const base64Data = saveDataBuffer.toString('base64');

    console.log('Carregando o save...');
    const result = await pkhex.save.load(base64Data);

    if (!result.success) {
      console.error('Falha ao carregar o save:', result.error);
      return;
    }

    handle = result.handle; // Guarda o 'handle'
    console.log('\n--- ✅ Save Carregado com Sucesso! ---');

    // 2. Extração Massiva de Dados
    console.log('Iniciando extração total de dados...');

    // Treinador e Save
    masterData.saveInfo = await safeCall(pkhex.save.getInfo, handle);
    masterData.trainerInfo = await safeCall(pkhex.save.trainer.getInfo, handle);
    masterData.trainerCard = await safeCall(pkhex.save.trainer.getCard, handle);
    masterData.appearance = await safeCall(pkhex.save.trainer.getAppearance, handle);
    masterData.rivalName = await safeCall(pkhex.save.trainer.getRivalName, handle);
    masterData.badges = await safeCall(pkhex.save.trainer.getBadges, handle);

    // Itens
    masterData.inventory = await safeCall(pkhex.save.items.getPouches, handle);

    // Pokédex
    masterData.pokedex = await safeCall(pkhex.save.pokedex.get, handle);

    // Boxes
    masterData.boxNames = await safeCall(pkhex.save.boxes.getNames, handle);
    masterData.boxWallpapers = await safeCall(pkhex.save.boxes.getWallpapers, handle);
    masterData.battleBox = await safeCall(pkhex.save.boxes.getBattleBox, handle);
    masterData.daycare = await safeCall(pkhex.save.boxes.getDaycare, handle);

    // Progresso
    masterData.battlePoints = await safeCall(pkhex.save.progress.getBattlePoints, handle);
    masterData.coins = await safeCall(pkhex.save.progress.getCoins, handle);
    masterData.records = await safeCall(pkhex.save.progress.getRecords, handle);
    masterData.battleFacility = await safeCall(pkhex.save.progress.getBattleFacilityStats, handle);
    masterData.hallOfFame = await safeCall(pkhex.save.progress.getHallOfFame, handle);

    // Tempo
    masterData.timePlayed = await safeCall(pkhex.save.time.getSecondsPlayed, handle);
    masterData.timeToStart = await safeCall(pkhex.save.time.getSecondsToStart, handle);
    masterData.timeToFame = await safeCall(pkhex.save.time.getSecondsToFame, handle);
    
    // Comunicação
    masterData.mailbox = await safeCall(pkhex.save.mail.getMailbox, handle);
    masterData.mysteryGifts = await safeCall(pkhex.save.mysteryGift.getAll, handle);
    masterData.mysteryGiftFlags = await safeCall(pkhex.save.mysteryGift.getFlags, handle);

    // Features Específicas de Geração (Muitas vão falhar, o que é esperado)
    masterData.features = {
      secretBase: await safeCall(pkhex.save.features.getSecretBase, handle),
      entralink: await safeCall(pkhex.save.features.getEntralinkData, handle),
      pokePelago: await safeCall(pkhex.save.features.getPokePelago, handle),
      festivalPlaza: await safeCall(pkhex.save.features.getFestivalPlaza, handle),
      pokeJobs: await safeCall(pkhex.save.features.getPokeJobs, handle)
    };
    
    // Pokémon (Usando a função complexa)
    masterData.pokemon = await getPokemonData(pkhex, handle);
    
    console.log('--- Extração Concluída! ---');

    // 3. O JSON COMPLETO QUE VOCÊ PEDIU
    console.log('\n--- JSON MESTRE (ABSOLUTAMENTE TUDO) ---');
    console.log(JSON.stringify(masterData, null, 2));

  } catch (err) {
    console.error('Ocorreu um erro fatal no script:', err);
  } finally {
    // 4. Limpeza (Sempre executa, mesmo se der erro)
    if (pkhex && handle) {
      await pkhex.save.dispose(handle);
      console.log('\nMemória liberada.');
    }
  }
}

// Executa
const saveParaLer = path.resolve('pokemon.sav');
lerTudoDoSave(saveParaLer);