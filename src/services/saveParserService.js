import setupPKHeX from 'pkhex';

const BADGE_FLAGS_FRLG = {
    Boulder: 2049, Cascade: 2050, Thunder: 2051, Rainbow: 2052,
    Soul: 2053, Marsh: 2054, Volcano: 2055, Earth: 2056
};

// --- Funções Helper ---
async function safeCall(apiFunction, handle, ...args) {
    try {
        const result = await apiFunction(handle, ...args);
        if (result && result.error) { return result.error; }
        return result;
    } catch (e) {
        return e.message;
    }
}

async function getBadgesFromFlags(pkhex, handle) {
    const badgeData = {};
    try {
        for (const [badgeName, flagIndex] of Object.entries(BADGE_FLAGS_FRLG)) {
            const flagResult = await pkhex.save.progress.getEventFlag(handle, flagIndex);
            badgeData[badgeName] = (flagResult && !flagResult.error) ? flagResult.value : false;
        }
        return badgeData;
    } catch (e) {
        return e.message;
    }
}

async function getPokemonData(pkhex, handle) {
    try {
        const partyDetails = [];
        const partySummaries = await pkhex.save.pokemon.getParty(handle);
        if (!Array.isArray(partySummaries)) return "Falha ao ler party.";

        for (let i = 0; i < partySummaries.length; i++) {
            if (partySummaries[i].species > 0) {
                const detail = await pkhex.save.pokemon.getPartySlot(handle, i);
                if (!detail.error) {
                    // Mapeia os dados do PKHeX para o nosso PlayerPokemonSchema
                    partyDetails.push(mapPkhexPokemonToSchema(detail, 'party', null, i));
                }
            }
        }

        const boxDetails = [];
        const pcSummaries = await pkhex.save.pokemon.getAll(handle);
        if (!Array.isArray(pcSummaries)) return "Falha ao ler PC.";

        for (const summary of pcSummaries) {
            if (summary.species > 0) {
                const detail = await pkhex.save.pokemon.get(handle, summary.box, summary.slot);
                if (!detail.error) {
                    // Mapeia os dados do PKHeX para o nosso PlayerPokemonSchema
                    boxDetails.push(mapPkhexPokemonToSchema(detail, 'box', summary.box, summary.slot));
                }
            }
        }

        return { party: partyDetails, box: boxDetails };
    } catch (e) {
        return e.message;
    }
}

// --- Funções de Mapeamento ---

// Traduz o inventário (array de pouches) para o nosso objeto
function mapInventory(rawInventory) {
    const inventory = {
        items: [], keyItems: [], balls: [], tmHms: [], berries: [], pcItems: []
    };

    if (!Array.isArray(rawInventory)) return inventory;

    // Helper para converter { itemId, itemName, count } -> { id, name, quantity }
    const formatItem = (pkhexItem) => ({
        id: pkhexItem.itemId,
        name: pkhexItem.itemName,
        quantity: pkhexItem.count
    });

    for (const pouch of rawInventory) {
        if (pouch.items && pouch.items.length > 0) {
            const formattedItems = pouch.items.map(formatItem);
            if (pouch.pouchType === "Items") inventory.items = formattedItems;
            if (pouch.pouchType === "KeyItems") inventory.keyItems = formattedItems;
            if (pouch.pouchType === "Balls") inventory.balls = formattedItems;
            if (pouch.pouchType === "TMHMs") inventory.tmHms = formattedItems;
            if (pouch.pouchType === "Berries") inventory.berries = formattedItems;
            if (pouch.pouchType === "PCItems") inventory.pcItems = formattedItems;
        }
    }
    return inventory;
}

// Traduz a pokedex (array de {species, seen, caught}) para o nosso objeto
function mapPokedex(rawPokedex) {
    const pokedex = { seen: [], caught: [] };
    if (!Array.isArray(rawPokedex)) return pokedex;

    for (const entry of rawPokedex) {
        if (entry.seen) pokedex.seen.push(entry.species);
        if (entry.caught) pokedex.caught.push(entry.species);
    }
    return pokedex;
}

// Traduz o JSON do Pokémon do PKHeX para o PlayerPokemonSchema
function mapPkhexPokemonToSchema(pkmn, type, box, slot) {
    // Helper para converter array [hp, atk, def, spa, spd, spe] para objeto
    const mapStatsArray = (stats) => ({
        hp: stats[0], atk: stats[1], def: stats[2], spa: stats[3], spd: stats[4], spe: stats[5]
    });

    const mapMoves = (ids, names) => {
        return ids.map((id, index) => ({ id, name: names[index] }))
            .filter(move => move.id > 0);
    };

    return {
        storageLocation: { type, box, slot },
        speciesId: pkmn.species,
        speciesName: pkmn.speciesName,
        nickname: pkmn.nickname,
        level: pkmn.level,
        isShiny: pkmn.isShiny,
        gender: pkmn.gender === 0 ? 'Male' : (pkmn.gender === 1 ? 'Female' : 'Genderless'),
        ability: { id: pkmn.ability, name: pkmn.abilityName },
        nature: pkmn.natureName,
        heldItem: { id: pkmn.heldItem, name: pkmn.heldItemName },
        metData: {
            metLocation: pkmn.metLocationName,
            metLevel: pkmn.metLevel,
            ball: pkmn.ball
        },
        stats: {
            ivs: mapStatsArray(pkmn.ivs),
            evs: mapStatsArray(pkmn.evs),
            total: mapStatsArray(pkmn.stats)
        },
        moves: mapMoves(pkmn.moves, pkmn.moveNames),
        originalTrainer: {
            name: pkmn.ot_Name,
            gender: pkmn.ot_Gender === 0 ? 'Male' : 'Female'
        }
    };
}

// --- O "Mapeador" Principal --- CORRIGIDO 11/11/2025
function mapPkhexToSchema(masterData) {
    const trainer = masterData.trainerInfo;
    const game = masterData.gameInfo;
    const extra = masterData.extraInfo;

    // Converte segundos para h/m/s
    let s = game.timePlayed;
    const hours = Math.floor(s / 3600);
    s %= 3600;
    const minutes = Math.floor(s / 60);
    const seconds = s % 60;

    // Traduz o inventário e a pokédex usando os helpers
    const mappedInventory = mapInventory(trainer.inventory);
    const mappedPokedex = mapPokedex(trainer.pokedex);

    const formattedSaveData = {
        lastUploaded: new Date(),
        saveLoaded: true,
        playerInfo: {
            playerName: trainer.ot, // <--- CORRIGIDO 11/11/2025
            trainerId: trainer.tid, // <--- CORRIGIDO 11/11/2025
            secretId: trainer.sid, // <--- CORRIGIDO 11/11/2025
            gender: trainer.gender === 0 ? 'Male' : 'Female', // <--- CORRIGIDO 11/11/2025
            money: trainer.money,
            timePlayed: { hours, minutes, seconds },
            gameInfo: {
                gameVersion: game.gameVersion, // <--- CORRIGIDO 11/11/2025
                generation: game.generation   // <--- CORRIGIDO 11/11/2025
            },
            secretBase: extra.secretBase.secretBase || {} // <--- CORRIGIDO 11/11/2025
        },
        progress: {
            badges: trainer.badges,
            pokedex: mappedPokedex, // <--- CORRIGIDO 11/11/2025
            gameCoins: extra.coins.coins || 0,
            hallOfFameEntries: extra.hallOfFame.entries || []
        },
        // Separa o inventário do PC
        inventory: {
            items: mappedInventory.items,
            keyItems: mappedInventory.keyItems,
            balls: mappedInventory.balls,
            tmHms: mappedInventory.tmHms,
            berries: mappedInventory.berries
        },
        pc: {
            boxNames: masterData.boxNames.names || [], // <--- CORRIGIDO 11/11/2025
            pcItems: mappedInventory.pcItems // <--- CORRIGIDO 11/11/2025
        },
        pokemon: {
            party: trainer.pokemon.party,
            box: trainer.pokemon.box
        }
    };

    return formattedSaveData;
}


// --- Função Principal ---
export async function parseSaveBuffer(saveFileBuffer) {
    const masterData = {};
    let pkhex, handle;

    try {
        pkhex = await setupPKHeX();
        const base64Data = saveFileBuffer.toString('base64');
        const result = await pkhex.save.load(base64Data);

        if (!result.success) {
            throw new Error(`Falha ao carregar o save: ${result.error}`);
        }

        handle = result.handle;

        masterData.gameInfo = await safeCall(pkhex.save.getInfo, handle);
        const secondsPlayed = await safeCall(pkhex.save.time.getSecondsPlayed, handle);
        masterData.gameInfo.timePlayed = secondsPlayed.secondsPlayed;

        masterData.trainerInfo = await safeCall(pkhex.save.trainer.getInfo, handle);
        masterData.trainerInfo.badges = await getBadgesFromFlags(pkhex, handle);
        masterData.trainerInfo.inventory = await safeCall(pkhex.save.items.getPouches, handle);
        masterData.trainerInfo.pokedex = await safeCall(pkhex.save.pokedex.get, handle);
        masterData.trainerInfo.pokemon = await getPokemonData(pkhex, handle);

        // O 'boxNames' não está no 'trainerInfo'
        masterData.boxNames = await safeCall(pkhex.save.boxes.getNames, handle); // <--- CORRIGIDO 11/11/2025

        masterData.extraInfo = {
            coins: await safeCall(pkhex.save.progress.getCoins, handle),
            hallOfFame: await safeCall(pkhex.save.progress.getHallOfFame, handle),
            secretBase: await safeCall(pkhex.save.features.getSecretBase, handle)
        };

        // 2. Mapeia os dados brutos para o formato do nosso Schema
        const formattedData = mapPkhexToSchema(masterData);

        return formattedData;

    } catch (err) {
        console.error('Erro no saveParserService:', err);
        throw err;
    } finally {
        if (pkhex && handle) {
            await pkhex.save.dispose(handle);
        }
    }
}