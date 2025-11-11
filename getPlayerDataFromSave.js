// Importa APENAS o default export
import setupPKHeX from 'pkhex';
import { readFile } from 'fs/promises';
import path from 'path';

async function lerSave(caminhoDoArquivo) {
  try {
    console.log('Iniciando a API do PKHeX.js...');
    const pkhex = await setupPKHeX();

    // 1. Carregar o Save
    console.log(`Lendo o arquivo: ${caminhoDoArquivo}`);
    const saveDataBuffer = await readFile(caminhoDoArquivo);
    const base64Data = saveDataBuffer.toString('base64');

    console.log('Carregando o save...');
    const result = await pkhex.save.load(base64Data);

    if (!result.success) {
      console.error('Falha ao carregar o save:', result.error);
      return;
    }

    const { handle } = result;
    console.log('\n--- ✅ Save Carregado com Sucesso! ---');

    // 2. Informações do Treinador e Jogo (Guardando os resultados)
    const saveMeta = await pkhex.save.getInfo(handle);
    const trainerMeta = await pkhex.save.trainer.getInfo(handle);

    console.log('\n--- Informações do Treinador ---');
    console.log(`Jogo: ${saveMeta.gameVersion}`);
    console.log(`OT (Original Trainer): ${trainerMeta.ot}`);
    if (trainerMeta.success) {
        console.log(`Dinheiro: ${trainerMeta.money}`);
        console.log(`Tempo de Jogo: ${trainerMeta.playedHours}h ${trainerMeta.playedMinutes}m`);
    }

    // 3. Inventário (Guardando o resultado)
    console.log('\nBuscando Inventário...');
    const inventory = await pkhex.save.items.getPouches(handle);
    if (Array.isArray(inventory)) {
        console.log('--- Inventário ---');
        for (const pouch of inventory) {
            const itemsNaBolsa = pouch.items.filter(item => item.count > 0);
            if (itemsNaBolsa.length > 0) {
                console.log(`Bolsa: ${pouch.pouchType} (${itemsNaBolsa.length} tipos de item)`);
                for (const item of itemsNaBolsa) {
                    console.log(`  - ${item.itemName} x${item.count}`);
                }
            }
        }
    } else {
        console.warn('Não foi possível ler o inventário:', inventory?.error || 'Erro desconhecido');
    }

    // 4. Pokédex (Guardando o resultado)
    console.log('\nBuscando Pokédex...');
    const pokedex = await pkhex.save.pokedex.get(handle);
    if (Array.isArray(pokedex)) {
        const seen = pokedex.filter(p => p.seen).length;
        const caught = pokedex.filter(p => p.caught).length;
        console.log('--- Pokédex ---');
        console.log(`Vistos: ${seen} | Capturados: ${caught}`);
    } else {
         console.warn('Não foi possível ler a Pokédex:', pokedex?.error || 'Erro desconhecido');
    }

    // 5. Pokémon (Party E Boxes)
    console.log('\nBuscando lista de Pokémon (Party e Boxes)...');
    const partySummaries = await pkhex.save.pokemon.getParty(handle); 
    const pcSummaries = await pkhex.save.pokemon.getAll(handle); 

    if (!Array.isArray(pcSummaries) || !Array.isArray(partySummaries)) {
        console.error('Erro ao buscar sumário de Pokémon (PC ou Party).');
        await pkhex.save.dispose(handle);
        return;
    }
    const pokemonSummaries = partySummaries.concat(pcSummaries);

    // 6. Buscar Detalhes Completos (Guardando em allPokemonDetails)
    const allPokemonDetails = [];
    console.log(`Encontrados ${pokemonSummaries.length} slots no total (Party + PC). Buscando detalhes...`);

    for (const summary of pokemonSummaries) {
        if (summary.species > 0) {
            
            let detailResult; 

            if (summary.box < 0) {
                detailResult = await pkhex.save.pokemon.getPartySlot(handle, summary.slot);
            } else {
                detailResult = await pkhex.save.pokemon.get(handle, summary.box, summary.slot);
            }

            if (!detailResult.error) {
                 allPokemonDetails.push(detailResult);
            } else {
                 console.warn(`Falha ao pegar detalhes do Pokémon (Box: ${summary.box}, Slot: ${summary.slot}):`, detailResult.error);
            }
        }
    }

    console.log(`\n--- Pokémon Detalhados Extraídos: ${allPokemonDetails.length} ---`);

    // --- SEÇÃO 7 MODIFICADA ---
    // 7. Montar o Objeto Completo (Player + Pokémon)
    console.log('\n--- JSON COMPLETO (Stringified) ---');

    // Cria o objeto mestre
    const fullSaveData = {
      playerData: (trainerMeta.success && saveMeta.success) ? {
        ot: trainerMeta.ot,
        tid: trainerMeta.tid,
        sid: trainerMeta.sid,
        money: trainerMeta.money,
        playedHours: trainerMeta.playedHours,
        playedMinutes: trainerMeta.playedMinutes,
        gameVersion: saveMeta.gameVersion
      } : { error: "Falha ao ler dados do player" },
      
      inventory: (Array.isArray(inventory) ? inventory : { error: "Falha ao ler inventário" }),
      pokedex: (Array.isArray(pokedex) ? pokedex : { error: "Falha ao ler pokedex" }),
      pokemon: allPokemonDetails
    };
    
    // Stringify o objeto mestre
    console.log(JSON.stringify(fullSaveData, null, 2));

    // 8. Limpeza
    await pkhex.save.dispose(handle);
    console.log('\nMemória liberada.');

  } catch (err) {
    console.error('Ocorreu um erro fatal:', err);
  }
}

// Executa
const saveParaLer = path.resolve('pokemon.sav');
lerSave(saveParaLer);