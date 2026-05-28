require('dotenv').config();
const {
    Client,
    GatewayIntentBits,
    SlashCommandBuilder,
    REST,
    Routes,
    ChannelType,
    PermissionFlagsBits,
    ActivityType,
    EmbedBuilder
} = require('discord.js');
const Database = require('better-sqlite3');
const path = require('path');

console.log('========================================');
console.log('[BOOT] Démarrage du bot...');
console.log('========================================');

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const OWNER_IDS = process.env.OWNER_IDS ? process.env.OWNER_IDS.split(',') : [];

console.log('[CONFIG] Vérification des variables d\'environnement...');
console.log(`[CONFIG] TOKEN: ${TOKEN ? '✅ Défini (' + TOKEN.substring(0, 20) + '...)' : '❌ MANQUANT!'}`);
console.log(`[CONFIG] CLIENT_ID: ${CLIENT_ID ? '✅ ' + CLIENT_ID : '❌ MANQUANT!'}`);
console.log(`[CONFIG] OWNER_IDS: ${OWNER_IDS.length > 0 ? '✅ ' + OWNER_IDS.join(', ') : '❌ MANQUANT!'}`);

if (!TOKEN || !CLIENT_ID) {
    console.error('[FATAL] Variables d\'environnement manquantes! Vérifiez votre fichier .env');
    process.exit(1);
}

console.log('[DB] Connexion à la base de données...');
const db = new Database(path.join(__dirname, 'database.db'));
console.log('[DB] ✅ Base de données connectée');

console.log('[DB] Initialisation de la table time_channels...');
db.exec(`
    CREATE TABLE IF NOT EXISTS time_channels (
        channel_id TEXT PRIMARY KEY,
        guild_id TEXT NOT NULL,
        timezone TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT
    )
`);
console.log('[DB] ✅ Table initialisée');

const queries = {
    insert: db.prepare('INSERT OR REPLACE INTO time_channels (channel_id, guild_id, timezone, created_by) VALUES (?, ?, ?, ?)'),
    delete: db.prepare('DELETE FROM time_channels WHERE channel_id = ?'),
    getAll: db.prepare('SELECT * FROM time_channels'),
    getByGuild: db.prepare('SELECT * FROM time_channels WHERE guild_id = ?'),
    getOne: db.prepare('SELECT * FROM time_channels WHERE channel_id = ?')
};

const existingChannels = queries.getAll.all();
console.log(`[DB] ${existingChannels.length} salon(s) configuré(s) dans la DB`);
existingChannels.forEach(ch => {
    console.log(`[DB]   - Channel: ${ch.channel_id} | Zone: ${ch.timezone} | Guild: ${ch.guild_id}`);
});

const TIMEZONES = {
    'paris': {
        name: 'Paris',
        timezone: 'Europe/Paris',
        emoji: '🇫🇷',
        utc: 'UTC+1'
    },
    'london': {
        name: 'Londres',
        timezone: 'Europe/London',
        emoji: '🇬🇧',
        utc: 'UTC+0'
    },
    'berlin': {
        name: 'Berlin',
        timezone: 'Europe/Berlin',
        emoji: '🇩🇪',
        utc: 'UTC+1'
    },
    'madrid': {
        name: 'Madrid',
        timezone: 'Europe/Madrid',
        emoji: '🇪🇸',
        utc: 'UTC+1'
    },
    'rome': {
        name: 'Rome',
        timezone: 'Europe/Rome',
        emoji: '🇮🇹',
        utc: 'UTC+1'
    },
    'amsterdam': {
        name: 'Amsterdam',
        timezone: 'Europe/Amsterdam',
        emoji: '🇳🇱',
        utc: 'UTC+1'
    },
    'brussels': {
        name: 'Bruxelles',
        timezone: 'Europe/Brussels',
        emoji: '🇧🇪',
        utc: 'UTC+1'
    },
    'lisbon': {
        name: 'Lisbonne',
        timezone: 'Europe/Lisbon',
        emoji: '🇵🇹',
        utc: 'UTC+0'
    },
    'moscow': {
        name: 'Moscou',
        timezone: 'Europe/Moscow',
        emoji: '🇷🇺',
        utc: 'UTC+3'
    },
    'vienna': {
        name: 'Vienne',
        timezone: 'Europe/Vienna',
        emoji: '🇦🇹',
        utc: 'UTC+1'
    },
    'warsaw': {
        name: 'Varsovie',
        timezone: 'Europe/Warsaw',
        emoji: '🇵🇱',
        utc: 'UTC+1'
    },
    'prague': {
        name: 'Prague',
        timezone: 'Europe/Prague',
        emoji: '🇨🇿',
        utc: 'UTC+1'
    },
    'budapest': {
        name: 'Budapest',
        timezone: 'Europe/Budapest',
        emoji: '🇭🇺',
        utc: 'UTC+1'
    },
    'athens': {
        name: 'Athènes',
        timezone: 'Europe/Athens',
        emoji: '🇬🇷',
        utc: 'UTC+2'
    },
    'stockholm': {
        name: 'Stockholm',
        timezone: 'Europe/Stockholm',
        emoji: '🇸🇪',
        utc: 'UTC+1'
    },
    'oslo': {
        name: 'Oslo',
        timezone: 'Europe/Oslo',
        emoji: '🇳🇴',
        utc: 'UTC+1'
    },
    'copenhagen': {
        name: 'Copenhague',
        timezone: 'Europe/Copenhagen',
        emoji: '🇩🇰',
        utc: 'UTC+1'
    },
    'helsinki': {
        name: 'Helsinki',
        timezone: 'Europe/Helsinki',
        emoji: '🇫🇮',
        utc: 'UTC+2'
    },
    'dublin': {
        name: 'Dublin',
        timezone: 'Europe/Dublin',
        emoji: '🇮🇪',
        utc: 'UTC+0'
    },
    'zurich': {
        name: 'Zurich',
        timezone: 'Europe/Zurich',
        emoji: '🇨🇭',
        utc: 'UTC+1'
    },
    'kiev': {
        name: 'Kiev',
        timezone: 'Europe/Kiev',
        emoji: '🇺🇦',
        utc: 'UTC+2'
    },
    'bucharest': {
        name: 'Bucarest',
        timezone: 'Europe/Bucharest',
        emoji: '🇷🇴',
        utc: 'UTC+2'
    },
    'istanbul': {
        name: 'Istanbul',
        timezone: 'Europe/Istanbul',
        emoji: '🇹🇷',
        utc: 'UTC+3'
    },

    'new_york': {
        name: 'New York',
        timezone: 'America/New_York',
        emoji: '🇺🇸',
        utc: 'UTC-5'
    },
    'los_angeles': {
        name: 'Los Angeles',
        timezone: 'America/Los_Angeles',
        emoji: '🇺🇸',
        utc: 'UTC-8'
    },
    'chicago': {
        name: 'Chicago',
        timezone: 'America/Chicago',
        emoji: '🇺🇸',
        utc: 'UTC-6'
    },
    'denver': {
        name: 'Denver',
        timezone: 'America/Denver',
        emoji: '🇺🇸',
        utc: 'UTC-7'
    },
    'toronto': {
        name: 'Toronto',
        timezone: 'America/Toronto',
        emoji: '🇨🇦',
        utc: 'UTC-5'
    },
    'vancouver': {
        name: 'Vancouver',
        timezone: 'America/Vancouver',
        emoji: '🇨🇦',
        utc: 'UTC-8'
    },
    'montreal': {
        name: 'Montréal',
        timezone: 'America/Montreal',
        emoji: '🇨🇦',
        utc: 'UTC-5'
    },
    'mexico_city': {
        name: 'Mexico',
        timezone: 'America/Mexico_City',
        emoji: '🇲🇽',
        utc: 'UTC-6'
    },
    'miami': {
        name: 'Miami',
        timezone: 'America/New_York',
        emoji: '🇺🇸',
        utc: 'UTC-5'
    },
    'phoenix': {
        name: 'Phoenix',
        timezone: 'America/Phoenix',
        emoji: '🇺🇸',
        utc: 'UTC-7'
    },
    'seattle': {
        name: 'Seattle',
        timezone: 'America/Los_Angeles',
        emoji: '🇺🇸',
        utc: 'UTC-8'
    },
    'las_vegas': {
        name: 'Las Vegas',
        timezone: 'America/Los_Angeles',
        emoji: '🇺🇸',
        utc: 'UTC-8'
    },

    'sao_paulo': {
        name: 'São Paulo',
        timezone: 'America/Sao_Paulo',
        emoji: '🇧🇷',
        utc: 'UTC-3'
    },
    'buenos_aires': {
        name: 'Buenos Aires',
        timezone: 'America/Argentina/Buenos_Aires',
        emoji: '🇦🇷',
        utc: 'UTC-3'
    },
    'lima': {
        name: 'Lima',
        timezone: 'America/Lima',
        emoji: '🇵🇪',
        utc: 'UTC-5'
    },
    'bogota': {
        name: 'Bogota',
        timezone: 'America/Bogota',
        emoji: '🇨🇴',
        utc: 'UTC-5'
    },
    'santiago': {
        name: 'Santiago',
        timezone: 'America/Santiago',
        emoji: '🇨🇱',
        utc: 'UTC-4'
    },
    'caracas': {
        name: 'Caracas',
        timezone: 'America/Caracas',
        emoji: '🇻🇪',
        utc: 'UTC-4'
    },
    'rio': {
        name: 'Rio de Janeiro',
        timezone: 'America/Sao_Paulo',
        emoji: '🇧🇷',
        utc: 'UTC-3'
    },

    'tokyo': {
        name: 'Tokyo',
        timezone: 'Asia/Tokyo',
        emoji: '🇯🇵',
        utc: 'UTC+9'
    },
    'seoul': {
        name: 'Séoul',
        timezone: 'Asia/Seoul',
        emoji: '🇰🇷',
        utc: 'UTC+9'
    },
    'shanghai': {
        name: 'Shanghai',
        timezone: 'Asia/Shanghai',
        emoji: '🇨🇳',
        utc: 'UTC+8'
    },
    'beijing': {
        name: 'Pékin',
        timezone: 'Asia/Shanghai',
        emoji: '🇨🇳',
        utc: 'UTC+8'
    },
    'hong_kong': {
        name: 'Hong Kong',
        timezone: 'Asia/Hong_Kong',
        emoji: '🇭🇰',
        utc: 'UTC+8'
    },
    'singapore': {
        name: 'Singapour',
        timezone: 'Asia/Singapore',
        emoji: '🇸🇬',
        utc: 'UTC+8'
    },
    'bangkok': {
        name: 'Bangkok',
        timezone: 'Asia/Bangkok',
        emoji: '🇹🇭',
        utc: 'UTC+7'
    },
    'mumbai': {
        name: 'Mumbai',
        timezone: 'Asia/Kolkata',
        emoji: '🇮🇳',
        utc: 'UTC+5:30'
    },
    'delhi': {
        name: 'New Delhi',
        timezone: 'Asia/Kolkata',
        emoji: '🇮🇳',
        utc: 'UTC+5:30'
    },
    'dubai': {
        name: 'Dubai',
        timezone: 'Asia/Dubai',
        emoji: '🇦🇪',
        utc: 'UTC+4'
    },
    'taipei': {
        name: 'Taipei',
        timezone: 'Asia/Taipei',
        emoji: '🇹🇼',
        utc: 'UTC+8'
    },
    'manila': {
        name: 'Manille',
        timezone: 'Asia/Manila',
        emoji: '🇵🇭',
        utc: 'UTC+8'
    },
    'jakarta': {
        name: 'Jakarta',
        timezone: 'Asia/Jakarta',
        emoji: '🇮🇩',
        utc: 'UTC+7'
    },
    'hanoi': {
        name: 'Hanoï',
        timezone: 'Asia/Ho_Chi_Minh',
        emoji: '🇻🇳',
        utc: 'UTC+7'
    },
    'kuala_lumpur': {
        name: 'Kuala Lumpur',
        timezone: 'Asia/Kuala_Lumpur',
        emoji: '🇲🇾',
        utc: 'UTC+8'
    },
    'riyadh': {
        name: 'Riyad',
        timezone: 'Asia/Riyadh',
        emoji: '🇸🇦',
        utc: 'UTC+3'
    },
    'tehran': {
        name: 'Téhéran',
        timezone: 'Asia/Tehran',
        emoji: '🇮🇷',
        utc: 'UTC+3:30'
    },
    'tel_aviv': {
        name: 'Tel Aviv',
        timezone: 'Asia/Jerusalem',
        emoji: '🇮🇱',
        utc: 'UTC+2'
    },
    'baghdad': {
        name: 'Bagdad',
        timezone: 'Asia/Baghdad',
        emoji: '🇮🇶',
        utc: 'UTC+3'
    },
    'karachi': {
        name: 'Karachi',
        timezone: 'Asia/Karachi',
        emoji: '🇵🇰',
        utc: 'UTC+5'
    },
    'dhaka': {
        name: 'Dacca',
        timezone: 'Asia/Dhaka',
        emoji: '🇧🇩',
        utc: 'UTC+6'
    },

    'sydney': {
        name: 'Sydney',
        timezone: 'Australia/Sydney',
        emoji: '🇦🇺',
        utc: 'UTC+11'
    },
    'melbourne': {
        name: 'Melbourne',
        timezone: 'Australia/Melbourne',
        emoji: '🇦🇺',
        utc: 'UTC+11'
    },
    'perth': {
        name: 'Perth',
        timezone: 'Australia/Perth',
        emoji: '🇦🇺',
        utc: 'UTC+8'
    },
    'brisbane': {
        name: 'Brisbane',
        timezone: 'Australia/Brisbane',
        emoji: '🇦🇺',
        utc: 'UTC+10'
    },
    'auckland': {
        name: 'Auckland',
        timezone: 'Pacific/Auckland',
        emoji: '🇳🇿',
        utc: 'UTC+13'
    },
    'wellington': {
        name: 'Wellington',
        timezone: 'Pacific/Auckland',
        emoji: '🇳🇿',
        utc: 'UTC+13'
    },

    'cairo': {
        name: 'Le Caire',
        timezone: 'Africa/Cairo',
        emoji: '🇪🇬',
        utc: 'UTC+2'
    },
    'johannesburg': {
        name: 'Johannesburg',
        timezone: 'Africa/Johannesburg',
        emoji: '🇿🇦',
        utc: 'UTC+2'
    },
    'lagos': {
        name: 'Lagos',
        timezone: 'Africa/Lagos',
        emoji: '🇳🇬',
        utc: 'UTC+1'
    },
    'nairobi': {
        name: 'Nairobi',
        timezone: 'Africa/Nairobi',
        emoji: '🇰🇪',
        utc: 'UTC+3'
    },
    'casablanca': {
        name: 'Casablanca',
        timezone: 'Africa/Casablanca',
        emoji: '🇲🇦',
        utc: 'UTC+1'
    },
    'tunis': {
        name: 'Tunis',
        timezone: 'Africa/Tunis',
        emoji: '🇹🇳',
        utc: 'UTC+1'
    },
    'algiers': {
        name: 'Alger',
        timezone: 'Africa/Algiers',
        emoji: '🇩🇿',
        utc: 'UTC+1'
    },
    'cape_town': {
        name: 'Le Cap',
        timezone: 'Africa/Johannesburg',
        emoji: '🇿🇦',
        utc: 'UTC+2'
    },
    'dakar': {
        name: 'Dakar',
        timezone: 'Africa/Dakar',
        emoji: '🇸🇳',
        utc: 'UTC+0'
    },
    'abidjan': {
        name: 'Abidjan',
        timezone: 'Africa/Abidjan',
        emoji: '🇨🇮',
        utc: 'UTC+0'
    },

    'mauritius': {
        name: 'Île Maurice',
        timezone: 'Indian/Mauritius',
        emoji: '🇲🇺',
        utc: 'UTC+4'
    },
    'reunion': {
        name: 'La Réunion',
        timezone: 'Indian/Reunion',
        emoji: '🇷🇪',
        utc: 'UTC+4'
    },
    'madagascar': {
        name: 'Madagascar',
        timezone: 'Indian/Antananarivo',
        emoji: '🇲🇬',
        utc: 'UTC+3'
    },
    'seychelles': {
        name: 'Seychelles',
        timezone: 'Indian/Mahe',
        emoji: '🇸🇨',
        utc: 'UTC+4'
    },
    'maldives': {
        name: 'Maldives',
        timezone: 'Indian/Maldives',
        emoji: '🇲🇻',
        utc: 'UTC+5'
    },
    'hawaii': {
        name: 'Hawaï',
        timezone: 'Pacific/Honolulu',
        emoji: '🇺🇸',
        utc: 'UTC-10'
    },
    'tahiti': {
        name: 'Tahiti',
        timezone: 'Pacific/Tahiti',
        emoji: '🇵🇫',
        utc: 'UTC-10'
    },
    'fiji': {
        name: 'Fidji',
        timezone: 'Pacific/Fiji',
        emoji: '🇫🇯',
        utc: 'UTC+12'
    },
    'guadeloupe': {
        name: 'Guadeloupe',
        timezone: 'America/Guadeloupe',
        emoji: '🇬🇵',
        utc: 'UTC-4'
    },
    'martinique': {
        name: 'Martinique',
        timezone: 'America/Martinique',
        emoji: '🇲🇶',
        utc: 'UTC-4'
    },
    'new_caledonia': {
        name: 'Nouvelle-Calédonie',
        timezone: 'Pacific/Noumea',
        emoji: '🇳🇨',
        utc: 'UTC+11'
    }
};

console.log(`[CONFIG] ${Object.keys(TIMEZONES).length} fuseaux horaires chargés`);

console.log('[DISCORD] Création du client Discord...');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildVoiceStates
    ]
});
console.log('[DISCORD] ✅ Client créé');

function isOwner(userId) {
    const result = OWNER_IDS.includes(userId);
    console.log(`[AUTH] Vérification owner pour ${userId}: ${result ? '✅ Owner' : '❌ Non owner'}`);
    return result;
}

const Colors = {
    Success: 0x57F287,
    Error: 0xED4245,
    Warning: 0xFEE75C,
    Info: 0x5865F2,
    Primary: 0x5865F2
};

function createEmbed(options) {
    const embed = new EmbedBuilder()
        .setColor(options.color || Colors.Primary)
        .setTimestamp();

    if (options.title) embed.setTitle(options.title);
    if (options.description) embed.setDescription(options.description);
    if (options.fields) embed.addFields(options.fields);
    if (options.footer) embed.setFooter({
        text: options.footer
    });
    if (options.thumbnail) embed.setThumbnail(options.thumbnail);

    return embed;
}

function getFormattedTime(timezoneKey) {
    console.log(`[TIME] Calcul de l'heure pour: ${timezoneKey}`);
    const tz = TIMEZONES[timezoneKey];
    if (!tz) {
        console.log(`[TIME] ❌ Fuseau horaire inconnu: ${timezoneKey}`);
        return null;
    }

    const now = new Date();
    const options = {
        timeZone: tz.timezone,
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };

    try {
        const time = now.toLocaleTimeString('fr-FR', options);
        const result = `🕐 ・${tz.name} ${time}`;
        console.log(`[TIME] ✅ ${timezoneKey} -> ${result}`);
        return result;
    } catch (error) {
        console.error(`[TIME] ❌ Erreur calcul heure pour ${timezoneKey}:`, error.message);
        return null;
    }
}

async function updateAllChannels() {
    console.log('[UPDATE] ========== Début mise à jour des salons ==========');
    const channels = queries.getAll.all();
    console.log(`[UPDATE] ${channels.length} salon(s) à vérifier`);

    if (channels.length === 0) {
        console.log('[UPDATE] Aucun salon configuré, rien à faire');
        console.log('[UPDATE] ========== Fin mise à jour ==========');
        return;
    }

    let updated = 0;
    let skipped = 0;
    let errors = 0;

    for (const data of channels) {
        console.log(`[UPDATE] Traitement du salon ${data.channel_id} (zone: ${data.timezone})`);

        try {
            console.log(`[UPDATE]   Fetch du channel...`);
            const channel = await client.channels.fetch(data.channel_id);

            if (!channel) {
                console.log(`[UPDATE]   ❌ Channel non trouvé (null)`);
                errors++;
                continue;
            }

            console.log(`[UPDATE]   Channel trouvé: "${channel.name}" (type: ${channel.type})`);

            if (channel.type !== ChannelType.GuildVoice) {
                console.log(`[UPDATE]   ⚠️ Ce n'est pas un salon vocal (type: ${channel.type}), skip`);
                skipped++;
                continue;
            }

            const newName = getFormattedTime(data.timezone);
            if (!newName) {
                console.log(`[UPDATE]   ❌ Impossible de calculer le nouveau nom`);
                errors++;
                continue;
            }

            console.log(`[UPDATE]   Nom actuel: "${channel.name}"`);
            console.log(`[UPDATE]   Nouveau nom: "${newName}"`);

            if (channel.name === newName) {
                console.log(`[UPDATE]   ⏭️ Nom identique, pas de changement nécessaire`);
                skipped++;
                continue;
            }

            console.log(`[UPDATE]   🔄 Renommage en cours...`);
            await channel.setName(newName);
            console.log(`[UPDATE]   ✅ Salon renommé avec succès!`);
            updated++;

        } catch (error) {
            console.error(`[UPDATE]   ❌ ERREUR: ${error.message}`);
            console.error(`[UPDATE]   Code d'erreur: ${error.code}`);
            errors++;

            if (error.code === 10003) {
                console.log(`[UPDATE]   🗑️ Le salon n'existe plus, suppression de la DB...`);
                queries.delete.run(data.channel_id);
                console.log(`[UPDATE]   ✅ Entrée supprimée de la DB`);
            } else if (error.code === 50013) {
                console.log(`[UPDATE]   ⚠️ Permissions insuffisantes pour renommer ce salon`);
            } else if (error.code === 50001) {
                console.log(`[UPDATE]   ⚠️ Pas d'accès à ce salon`);
            }
        }
    }

    console.log('[UPDATE] ========== Résumé ==========');
    console.log(`[UPDATE] ✅ Mis à jour: ${updated}`);
    console.log(`[UPDATE] ⏭️ Ignorés: ${skipped}`);
    console.log(`[UPDATE] ❌ Erreurs: ${errors}`);
    console.log('[UPDATE] ========== Fin mise à jour ==========');
}

async function deployCommands() {
    console.log('[DEPLOY] Préparation des commandes slash...');

    const commands = [
        new SlashCommandBuilder()
        .setName('settime')
        .setDescription('Configure un salon vocal pour afficher l\'heure d\'un pays')
        .addStringOption(option =>
            option.setName('pays')
            .setDescription('Le pays/ville dont afficher l\'heure (tapez pour rechercher)')
            .setRequired(true)
            .setAutocomplete(true))
        .addChannelOption(option =>
            option.setName('channel')
            .setDescription('Le salon vocal à modifier')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

        new SlashCommandBuilder()
        .setName('removetime')
        .setDescription('Retire la configuration d\'heure d\'un salon vocal')
        .addChannelOption(option =>
            option.setName('channel')
            .setDescription('Le salon vocal à retirer')
            .setRequired(true)
            .addChannelTypes(ChannelType.GuildVoice))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

        new SlashCommandBuilder()
        .setName('listtime')
        .setDescription('Liste tous les salons configurés avec leur fuseau horaire')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

        new SlashCommandBuilder()
        .setName('forceupdatetime')
        .setDescription('[Owner] Force la mise à jour de tous les salons'),

        new SlashCommandBuilder()
        .setName('bot-name')
        .setDescription('[Owner] Change le nom du bot')
        .addStringOption(option =>
            option.setName('name')
            .setDescription('Le nouveau nom du bot')
            .setRequired(true)
            .setMinLength(2)
            .setMaxLength(32)),

        new SlashCommandBuilder()
        .setName('bot-avatar')
        .setDescription('[Owner] Change l\'avatar du bot')
        .addStringOption(option =>
            option.setName('url')
            .setDescription('URL de l\'image (PNG, JPG, GIF)')
            .setRequired(false))
        .addAttachmentOption(option =>
            option.setName('image')
            .setDescription('Uploader une image directement')
            .setRequired(false)),

        new SlashCommandBuilder()
        .setName('bot-activities')
        .setDescription('[Owner] Change l\'activité du bot')
        .addStringOption(option =>
            option.setName('type')
            .setDescription('Type d\'activité')
            .setRequired(true)
            .addChoices({
                name: 'Playing (Joue à)',
                value: 'playing'
            }, {
                name: 'Listening (Écoute)',
                value: 'listening'
            }, {
                name: 'Watching (Regarde)',
                value: 'watching'
            }, {
                name: 'Competing (Participe à)',
                value: 'competing'
            }, {
                name: 'Streaming',
                value: 'streaming'
            }))
        .addStringOption(option =>
            option.setName('description')
            .setDescription('Description de l\'activité')
            .setRequired(true)
            .setMaxLength(128))
        .addStringOption(option =>
            option.setName('url')
            .setDescription('URL du stream (uniquement pour Streaming, Twitch/YouTube)')
            .setRequired(false)),

        new SlashCommandBuilder()
        .setName('bot-status')
        .setDescription('[Owner] Change le statut du bot')
        .addStringOption(option =>
            option.setName('status')
            .setDescription('Le statut du bot')
            .setRequired(true)
            .addChoices({
                name: 'Online (En ligne)',
                value: 'online'
            }, {
                name: 'Idle (Inactif)',
                value: 'idle'
            }, {
                name: 'DND (Ne pas déranger)',
                value: 'dnd'
            }, {
                name: 'Invisible',
                value: 'invisible'
            }))
    ];

    console.log(`[DEPLOY] ${commands.length} commandes préparées`);

    const rest = new REST({
        version: '10'
    }).setToken(TOKEN);

    try {
        console.log('[DEPLOY] Envoi des commandes à Discord...');
        await rest.put(
            Routes.applicationCommands(CLIENT_ID), {
                body: commands.map(cmd => cmd.toJSON())
            }
        );
        console.log('[DEPLOY] ✅ Commandes enregistrées avec succès!');
    } catch (error) {
        console.error('[DEPLOY] ❌ ERREUR lors de l\'enregistrement:', error.message);
        if (error.code) console.error('[DEPLOY] Code d\'erreur:', error.code);
        if (error.rawError) console.error('[DEPLOY] Détails:', JSON.stringify(error.rawError, null, 2));
    }
}

client.on('interactionCreate', async interaction => {
    console.log(`[INTERACTION] Reçue: type=${interaction.type}, user=${interaction.user.tag}`);

    if (interaction.isAutocomplete()) {
        const focusedValue = interaction.options.getFocused().toLowerCase();
        console.log(`[AUTOCOMPLETE] Recherche: "${focusedValue}"`);

        const filtered = Object.entries(TIMEZONES)
            .filter(([key, value]) => {
                const searchTerms = [
                    key.toLowerCase(),
                    value.name.toLowerCase(),
                    value.utc.toLowerCase()
                ];
                return searchTerms.some(term => term.includes(focusedValue));
            })
            .slice(0, 25)
            .map(([key, value]) => ({
                name: `${value.emoji} ${value.name} (${value.utc})`,
                value: key
            }));

        console.log(`[AUTOCOMPLETE] ${filtered.length} résultat(s) trouvé(s)`);

        try {
            await interaction.respond(filtered);
            console.log('[AUTOCOMPLETE] ✅ Réponse envoyée');
        } catch (error) {
            console.error('[AUTOCOMPLETE] ❌ Erreur:', error.message);
        }
        return;
    }

    if (!interaction.isChatInputCommand()) {
        console.log('[INTERACTION] Pas une commande slash, ignorée');
        return;
    }

    console.log(`[CMD] Commande: /${interaction.commandName}`);
    console.log(`[CMD] Utilisateur: ${interaction.user.tag} (${interaction.user.id})`);
    console.log(`[CMD] Serveur: ${interaction.guild?.name} (${interaction.guildId})`);

    try {
        if (interaction.commandName === 'settime') {
            const pays = interaction.options.getString('pays');
            const channel = interaction.options.getChannel('channel');

            console.log(`[CMD:settime] Pays: ${pays}`);
            console.log(`[CMD:settime] Channel: ${channel.name} (${channel.id})`);

            const tzInfo = TIMEZONES[pays];

            if (!tzInfo) {
                console.log(`[CMD:settime] ❌ Pays invalide: ${pays}`);
                const embed = createEmbed({
                    title: '❌ Pays invalide',
                    description: `Le pays \`${pays}\` n'existe pas dans la liste.\n\n**Conseil:** Utilisez l'autocomplete pour sélectionner un pays valide.`,
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            console.log(`[CMD:settime] Zone trouvée: ${tzInfo.name} (${tzInfo.timezone})`);

            const existing = queries.getOne.get(channel.id);
            console.log(`[CMD:settime] Config existante:`, existing || 'Aucune');

            if (existing && existing.timezone === pays) {
                console.log(`[CMD:settime] ⚠️ Même zone déjà configurée`);
                const embed = createEmbed({
                    title: '⚠️ Déjà configuré',
                    description: `Ce salon est déjà configuré avec **${tzInfo.emoji} ${tzInfo.name}**`,
                    color: Colors.Warning
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            await interaction.deferReply({
                ephemeral: true
            });
            console.log(`[CMD:settime] Réponse différée`);

            console.log(`[CMD:settime] Sauvegarde dans la DB...`);
            queries.insert.run(channel.id, interaction.guildId, pays, interaction.user.id);
            console.log(`[CMD:settime] ✅ Sauvegardé dans la DB`);

            try {
                const newName = getFormattedTime(pays);
                console.log(`[CMD:settime] Renommage du salon en: ${newName}`);
                await channel.setName(newName);
                console.log(`[CMD:settime] ✅ Salon renommé`);

                const embed = createEmbed({
                    title: '✅ Configuration réussie',
                    description: `Le salon affichera maintenant l'heure de **${tzInfo.emoji} ${tzInfo.name}**`,
                    color: Colors.Success,
                    fields: [{
                            name: '🌍 Fuseau horaire',
                            value: tzInfo.utc,
                            inline: true
                        },
                        {
                            name: '📝 Nouveau nom',
                            value: `\`${newName}\``,
                            inline: true
                        }
                    ]
                });
                await interaction.editReply({
                    embeds: [embed]
                });
            } catch (error) {
                console.error(`[CMD:settime] ❌ Erreur renommage:`, error.message);
                const embed = createEmbed({
                    title: '❌ Erreur',
                    description: `Impossible de renommer le salon.\n\n**Raison:** ${error.message}`,
                    color: Colors.Error,
                    footer: 'Vérifiez que le bot a la permission de gérer les salons.'
                });
                await interaction.editReply({
                    embeds: [embed]
                });
            }
        } else if (interaction.commandName === 'removetime') {
            const channel = interaction.options.getChannel('channel');
            console.log(`[CMD:removetime] Channel: ${channel.name} (${channel.id})`);

            const existing = queries.getOne.get(channel.id);
            console.log(`[CMD:removetime] Config existante:`, existing || 'Aucune');

            if (existing) {
                console.log(`[CMD:removetime] Suppression de la DB...`);
                queries.delete.run(channel.id);
                console.log(`[CMD:removetime] ✅ Supprimé`);

                const embed = createEmbed({
                    title: '✅ Configuration supprimée',
                    description: `Le salon **${channel.name}** ne sera plus mis à jour automatiquement.`,
                    color: Colors.Success
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } else {
                console.log(`[CMD:removetime] ❌ Salon non configuré`);
                const embed = createEmbed({
                    title: '❌ Non configuré',
                    description: `Ce salon n'est pas configuré pour afficher l'heure.`,
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
        } else if (interaction.commandName === 'listtime') {
            console.log(`[CMD:listtime] Récupération des salons du serveur ${interaction.guildId}`);
            const guildChannels = queries.getByGuild.all(interaction.guildId);
            console.log(`[CMD:listtime] ${guildChannels.length} salon(s) trouvé(s)`);

            if (guildChannels.length === 0) {
                const embed = createEmbed({
                    title: '📋 Liste des salons',
                    description: 'Aucun salon configuré sur ce serveur.',
                    color: Colors.Info
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            let list = '';
            for (const data of guildChannels) {
                const tzInfo = TIMEZONES[data.timezone];
                if (tzInfo) {
                    list += `<#${data.channel_id}> → ${tzInfo.emoji} **${tzInfo.name}** (${tzInfo.utc})\n`;
                } else {
                    list += `<#${data.channel_id}> → ⚠️ Zone inconnue: ${data.timezone}\n`;
                }
            }

            const embed = createEmbed({
                title: '📋 Salons configurés',
                description: list,
                color: Colors.Info,
                footer: `${guildChannels.length} salon(s) configuré(s)`
            });
            await interaction.reply({
                embeds: [embed],
                ephemeral: true
            });
        } else if (interaction.commandName === 'forceupdatetime') {
            console.log(`[CMD:forceupdatetime] Demandé par ${interaction.user.id}`);

            if (!isOwner(interaction.user.id)) {
                console.log(`[CMD:forceupdatetime] ❌ Non autorisé`);
                const embed = createEmbed({
                    title: '🔒 Accès refusé',
                    description: 'Cette commande est réservée aux owners du bot.',
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            console.log(`[CMD:forceupdatetime] Autorise, lancement de la mise a jour...`);
            await interaction.deferReply({
                ephemeral: true
            });
            await updateAllChannels();
            const embed = createEmbed({
                title: '🔄 Mise à jour forcée',
                description: 'Tous les salons ont été mis à jour avec succès!',
                color: Colors.Success
            });
            await interaction.editReply({
                embeds: [embed]
            });
        } else if (interaction.commandName === 'bot-name') {
            console.log(`[CMD:bot-name] Demande par ${interaction.user.id}`);

            if (!isOwner(interaction.user.id)) {
                console.log(`[CMD:bot-name] Non autorise`);
                const embed = createEmbed({
                    title: '🔒 Accès refusé',
                    description: 'Cette commande est réservée aux owners du bot.',
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            const newName = interaction.options.getString('name');
            console.log(`[CMD:bot-name] Nouveau nom: ${newName}`);

            await interaction.deferReply({
                ephemeral: true
            });

            try {
                await client.user.setUsername(newName);
                console.log(`[CMD:bot-name] Nom change avec succes`);
                const embed = createEmbed({
                    title: '✏️ Nom modifié',
                    description: `Le nom du bot a été changé en **${newName}**`,
                    color: Colors.Success
                });
                await interaction.editReply({
                    embeds: [embed]
                });
            } catch (error) {
                console.error(`[CMD:bot-name] Erreur:`, error.message);
                const embed = createEmbed({
                    title: '❌ Erreur',
                    description: `Impossible de changer le nom.\n\n**Raison:** ${error.message}`,
                    color: Colors.Error
                });
                await interaction.editReply({
                    embeds: [embed]
                });
            }
        } else if (interaction.commandName === 'bot-avatar') {
            console.log(`[CMD:bot-avatar] Demande par ${interaction.user.id}`);

            if (!isOwner(interaction.user.id)) {
                console.log(`[CMD:bot-avatar] Non autorise`);
                const embed = createEmbed({
                    title: '🔒 Accès refusé',
                    description: 'Cette commande est réservée aux owners du bot.',
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            const url = interaction.options.getString('url');
            const attachment = interaction.options.getAttachment('image');

            if (!url && !attachment) {
                const embed = createEmbed({
                    title: '⚠️ Paramètre manquant',
                    description: 'Tu dois fournir une **URL** ou **uploader une image**.',
                    color: Colors.Warning
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            const avatarUrl = attachment ? attachment.url : url;
            console.log(`[CMD:bot-avatar] URL avatar: ${avatarUrl}`);

            await interaction.deferReply({
                ephemeral: true
            });

            try {
                await client.user.setAvatar(avatarUrl);
                console.log(`[CMD:bot-avatar] Avatar change avec succes`);
                const embed = createEmbed({
                    title: '🖼️ Avatar modifié',
                    description: `L'avatar du bot a été changé avec succès!`,
                    color: Colors.Success,
                    thumbnail: avatarUrl
                });
                await interaction.editReply({
                    embeds: [embed]
                });
            } catch (error) {
                console.error(`[CMD:bot-avatar] Erreur:`, error.message);
                const embed = createEmbed({
                    title: '❌ Erreur',
                    description: `Impossible de changer l'avatar.\n\n**Raison:** ${error.message}`,
                    color: Colors.Error
                });
                await interaction.editReply({
                    embeds: [embed]
                });
            }
        } else if (interaction.commandName === 'bot-activities') {
            console.log(`[CMD:bot-activities] Demande par ${interaction.user.id}`);

            if (!isOwner(interaction.user.id)) {
                console.log(`[CMD:bot-activities] Non autorise`);
                const embed = createEmbed({
                    title: '🔒 Accès refusé',
                    description: 'Cette commande est réservée aux owners du bot.',
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            const type = interaction.options.getString('type');
            const description = interaction.options.getString('description');
            const streamUrl = interaction.options.getString('url');

            console.log(`[CMD:bot-activities] Type: ${type}, Description: ${description}, URL: ${streamUrl || 'aucune'}`);

            if (type === 'streaming' && !streamUrl) {
                const embed = createEmbed({
                    title: '⚠️ URL requise',
                    description: 'Pour le type **Streaming**, tu dois fournir une URL Twitch ou YouTube valide.',
                    color: Colors.Warning
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            const activityTypes = {
                'playing': ActivityType.Playing,
                'listening': ActivityType.Listening,
                'watching': ActivityType.Watching,
                'competing': ActivityType.Competing,
                'streaming': ActivityType.Streaming
            };

            try {
                const activityOptions = {
                    name: description,
                    type: activityTypes[type]
                };

                if (type === 'streaming') {
                    activityOptions.url = streamUrl;
                }

                client.user.setActivity(activityOptions);
                console.log(`[CMD:bot-activities] Activite changee avec succes`);

                const typeNames = {
                    'playing': '🎮 Joue à',
                    'listening': '🎧 Écoute',
                    'watching': '👀 Regarde',
                    'competing': '🏆 Participe à',
                    'streaming': '📺 Streame'
                };

                const embed = createEmbed({
                    title: '🎯 Activité modifiée',
                    description: `**${typeNames[type]}** ${description}`,
                    color: Colors.Success,
                    fields: type === 'streaming' ? [{
                        name: '🔗 URL',
                        value: streamUrl,
                        inline: false
                    }] : []
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } catch (error) {
                console.error(`[CMD:bot-activities] Erreur:`, error.message);
                const embed = createEmbed({
                    title: '❌ Erreur',
                    description: `Impossible de changer l'activité.\n\n**Raison:** ${error.message}`,
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
        } else if (interaction.commandName === 'bot-status') {
            console.log(`[CMD:bot-status] Demande par ${interaction.user.id}`);

            if (!isOwner(interaction.user.id)) {
                console.log(`[CMD:bot-status] Non autorise`);
                const embed = createEmbed({
                    title: '🔒 Accès refusé',
                    description: 'Cette commande est réservée aux owners du bot.',
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
                return;
            }

            const status = interaction.options.getString('status');
            console.log(`[CMD:bot-status] Nouveau statut: ${status}`);

            try {
                client.user.setStatus(status);
                console.log(`[CMD:bot-status] Statut change avec succes`);

                const statusNames = {
                    'online': '🟢 En ligne',
                    'idle': '🌙 Inactif',
                    'dnd': '⛔ Ne pas déranger',
                    'invisible': '👻 Invisible'
                };

                const embed = createEmbed({
                    title: '🔄 Statut modifié',
                    description: `Le statut du bot a été changé en **${statusNames[status]}**`,
                    color: Colors.Success
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            } catch (error) {
                console.error(`[CMD:bot-status] Erreur:`, error.message);
                const embed = createEmbed({
                    title: '❌ Erreur',
                    description: `Impossible de changer le statut.\n\n**Raison:** ${error.message}`,
                    color: Colors.Error
                });
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
        }

    } catch (error) {
        console.error(`[CMD] ❌ Erreur lors de l'exécution de la commande:`, error.message);
        console.error(`[CMD] Code d'erreur:`, error.code);

        try {
            const embed = createEmbed({
                title: '❌ Erreur inattendue',
                description: `Une erreur s'est produite lors de l'exécution de la commande.\n\n**Détails:** ${error.message}`,
                color: Colors.Error
            });
            if (interaction.deferred) {
                await interaction.editReply({
                    embeds: [embed]
                });
            } else if (!interaction.replied) {
                await interaction.reply({
                    embeds: [embed],
                    ephemeral: true
                });
            }
        } catch (replyError) {
            console.error(`[CMD] ❌ Impossible de répondre à l'interaction:`, replyError.message);
        }
    }
});

client.on('error', error => {
    console.error('[DISCORD] ❌ Erreur client:', error.message);
});

client.on('warn', warning => {
    console.warn('[DISCORD] ⚠️ Warning:', warning);
});

client.on('debug', info => {

});

client.once('ready', async () => {
    console.log('========================================');
    console.log(`[READY] ✅ Connecté en tant que ${client.user.tag}`);
    console.log(`[READY] ID: ${client.user.id}`);
    console.log(`[READY] Serveurs: ${client.guilds.cache.size}`);
    console.log(`[READY] Owners: ${OWNER_IDS.join(', ')}`);
    console.log(`[READY] Fuseaux horaires: ${Object.keys(TIMEZONES).length}`);
    console.log('========================================');

    client.user.setPresence({
        status: 'online',
        activities: []
    });
    console.log('[READY] Statut défini: online (sans activité)');

    await deployCommands();

    console.log('[READY] Première mise à jour des salons...');
    await updateAllChannels();

    console.log('[READY] Démarrage du timer (toutes les 5 minutes)');
    setInterval(() => {
        console.log('[TIMER] Tick - Lancement mise à jour automatique');
        updateAllChannels();
    }, 5 * 60 * 1000);

    console.log('========================================');
    console.log('[READY] 🕐 Bot opérationnel!');
    console.log('========================================');
});

process.on('SIGINT', () => {
    console.log('\n[SHUTDOWN] Signal SIGINT reçu');
    console.log('[SHUTDOWN] Fermeture de la base de données...');
    db.close();
    console.log('[SHUTDOWN] ✅ Base de données fermée');
    console.log('[SHUTDOWN] Au revoir!');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n[SHUTDOWN] Signal SIGTERM reçu');
    console.log('[SHUTDOWN] Fermeture de la base de données...');
    db.close();
    console.log('[SHUTDOWN] ✅ Base de données fermée');
    console.log('[SHUTDOWN] Au revoir!');
    process.exit(0);
});

process.on('uncaughtException', error => {
    console.error('[FATAL] Exception non gérée:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('[FATAL] Promise rejetée non gérée:', reason);
});

console.log('[DISCORD] Tentative de connexion...');
client.login(TOKEN).then(() => {
    console.log('[DISCORD] ✅ Login réussi, en attente de l\'événement ready...');
}).catch(error => {
    console.error('[DISCORD] ❌ ERREUR de connexion:', error.message);
    console.error('[DISCORD] Vérifiez que le TOKEN est valide dans le fichier .env');
    process.exit(1);
});
