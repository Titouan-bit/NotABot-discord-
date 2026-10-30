const express = require('express');
const cors = require('cors');
const { Client, GatewayIntentBits, ChannelType, PermissionFlagsBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const mongoose = require('mongoose');

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGO_URI;
if (!uri) {
    console.error('❌ MONGO_URI manquant dans les variables d\'environnement.');
    process.exit(1);
}
const http = require('http');
const https = require('https');
mongoose.connect(uri)
    .then(() => console.log('✅ Connecté à MongoDB'))
    .catch((err) => console.error('❌ Erreur connexion MongoDB:', err));

const configSchema = new mongoose.Schema({
    guildId: { type: String, required: true, unique: true },
    s0urcechannelid: {type: String, required: false, unique: true}
});
const GuildConfig = mongoose.model('GuildConfig', configSchema);

const userSchema = new mongoose.Schema({
    userId: { type: String, required: true },
    guildId: { type: String, required: true },
    username: { type: String, required: true },
    xp: {type: Number, default: 0},
    level: {type: Number, default: 0}
});
const s0urceUserSchema = new mongoose.Schema({
    s0urceName: { type: String, required: true, unique: true },
    discordId: { type: String, required: true }
});
const S0urceUser = mongoose.model('S0urceUser', s0urceUserSchema);
userSchema.index({ userId: 1, guildId: 1 }, { unique: true });
const UserData = mongoose.model('UserData', userSchema);
async function getConfig(guildId) {
    let config = await GuildConfig.findOne({ guildId });
    if (!config) {
        config = await GuildConfig.create({ guildId });
    }
    return config;
}
let xpNeeded = 0;
process.on('unhandledRejection', (err) => console.error('❌ Unhandled rejection:', err));
process.on('uncaughtException', (err) => console.error('❌ Uncaught exception:', err));

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ]
});

client.on('error', (err) => console.error('❌ Client error:', err));
client.on('shardDisconnect', (e, id) => console.error(`❌ Shard ${id} déconnecté`, e?.code));

client.once('ready', () => {
    console.log(`🤖 Bot Discord connecté en tant que ${client.user.tag} !`);
});
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`🚀 Serveur web Discord actif sur le port ${port}`);
    fetch('https://discord.com/api/v10/gateway').then(r => console.log('[test] status', r.status)).catch(e => console.log('[test] erreur', e.message));

    const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
    if (!DISCORD_TOKEN) {
        console.error('❌ DISCORD_TOKEN manquant dans les variables d\'environnement.');
        process.exit(1);
    }
    client.on('debug', (info) => console.log('[debug]', info));
    client.on('shardError', (err) => console.error('❌ shardError:', err));
    client.rest.on('rateLimited', (info) => console.log('[rateLimit]', info));
    client.login(DISCORD_TOKEN).catch((err) => console.error('❌ Login échoué:', err));
});
setInterval(() => {
    http.get(`http://localhost:${port}/ping`, (res) => {}).on('error', () => {});
    https.get('https://notabot-discord.onrender.com', (res) => {}).on('error', () => {});
}, 5 * 60 * 1000);
const announceSchema = new mongoose.Schema({
    seller: String, item: String, price: String, description: String
});
const Announce = mongoose.model('Announce', announceSchema);
const SendNewAnnounce = async function(s0urceChannel, a) {
    const CreatenewAnnounceEmbed = new EmbedBuilder()
        .setTitle('Nouvelle Annonce !')
        .setColor('#1E3A8A')
        .setDescription(`${a.item} : ${a.price}\n${a.description}\nVendu par : ${a.seller}`)

    const row = new ActionRowBuilder();

    const BUYIT = new ButtonBuilder()
        .setCustomId(`BUY | ${a.seller} | ${a.item}`)
        .setLabel('BUY')
        .setEmoji('🤑')
        .setStyle(ButtonStyle.Secondary);

    row.addComponents(BUYIT);

    await s0urceChannel.send('@notifAnnounces, il y a une nouvelle annonce');
    setTimeout(() => s0urceChannel.send({ embeds: [CreatenewAnnounceEmbed], components: [row] }), 200);
};
function genererCode(longueur = 16) {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let code = '';
    for (let i = 0; i < longueur; i++) {
        const randomIndex = Math.floor(Math.random() * caracteres.length);
        code += caracteres[randomIndex];
    }
    return code;
}
client.on('messageCreate', async function(message){
    let sender = await UserData.findOne({ userId: message.author.id, });
    if (!sender) sender = new UserData({ userId: message.author.id, });
    console.log(`message recu de ${sender}, lvl ${sender.level} xp, ${sender.xp}`);
    sender.xp += 15;
    const senderlvl = sender.level;
    if (senderlvl == 0){
        xpNeeded = 100;
    } else if (senderlvl = 1){
        xpNeeded = 200;
    } else if (senderlvl = 2){
        xpNeeded = 350;
    } else if (senderlvl = 3){
        xpNeeded = 500;
    } else if (senderlvl = 4){
        xpNeeded = 750;
    } else if (senderlvl = 5){
        xpNeeded = 1000;
    } else if (senderlvl = 6){
        xpNeeded = 1300;
    } else if (senderlvl = 7){
        xpNeeded = 1800;
    }
    if (sender.xp >= xpNeeded) {
            sender.level += 1;
            sender.xp = 0;
            if (sender.level == 1){
                message.member.roles.add(message.guild.roles.cache.find(r => r.name === `Actif commun`));
                await message.channel.send(`congrats: <@${message.author.id}> Est passé lvl ${sender.level}, a obtenu le role: Actif commun et gagne un commun de son choix`);
                const monCode = genererCode(16);
                try {
                    await message.author.send(`GG pour avoir gagné le niveau 1 ton code ici: ${monCode}. Pour l'utiliser, vous devez juste ouvrir s0urce, envoyer en MP à NotABot "marketplace" et envoyer "code: <le code>".`);
                } catch (error) {
                    await message.channel.send(`<@${message.author.id}>, Vos mp sont fermés, veuillez les ouvrir et contacter <@Titouan> car je ne peux pas actuellement gerer ce beug`);
                }
                await fetch('https://notabot-qecj.onrender.com/sendcodefornewlevel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: monCode, description: 'common'})
                });

            }
            if (sender.level == 2){
                message.member.roles.add(message.guild.roles.cache.find(r => r.name === `Actif uncommun`));
                await message.channel.send(`congrats: <@${message.author.id}> Est passé lvl ${sender.level}, a obtenu le role: Actif uncommun et gagne un uncommon de son choix`);
                const monCode = genererCode(16);
                await fetch('https://notabot-qecj.onrender.com/sendcodefornewlevel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: monCode, description: 'uncommon'})
                });
            }
            if (sender.level == 3){
                message.member.roles.add(message.guild.roles.cache.find(r => r.name === `Actif rare`));
                await message.channel.send(`congrats: <@${message.author.id}> Est passé lvl ${sender.level}, a obtenu le role: Actif rare et gagne un rare de son choix`);
                const monCode = genererCode(16);
                await fetch('https://notabot-qecj.onrender.com/sendcodefornewlevel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: monCode, description: 'rare'})
                });
            }
            if (sender.level == 4){
                message.member.roles.add(message.guild.roles.cache.find(r => r.name === `Actif epic`));
                await message.channel.send(`congrats: <@${message.author.id}> Est passé lvl ${sender.level}, a obtenu le role: Actif epic et gagne un epic de son choix`);
                const monCode = genererCode(16);
                await fetch('https://notabot-qecj.onrender.com/sendcodefornewlevel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: monCode, description: 'epic'})
                });
            }
            if (sender.level == 5){
                message.member.roles.add(message.guild.roles.cache.find(r => r.name === `Actif leg`));
                await message.channel.send(`congrats: <@${message.author.id}> Est passé lvl ${sender.level}, a obtenu le role: Actif leg et gagne un leg de son choix`);
                const monCode = genererCode(16);
                await fetch('https://notabot-qecj.onrender.com/sendcodefornewlevel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: monCode, description: 'legendary'})
                });
            }
            if (sender.level == 6){
                message.member.roles.add(message.guild.roles.cache.find(r => r.name === `Actif mythic`));
                await message.channel.send(`congrats: <@${message.author.id}> Est passé lvl ${sender.level}, a obtenu le role: Actif mythic et gagne un mythic de son choix`);
                const monCode = genererCode(16);
                await fetch('https://notabot-qecj.onrender.com/sendcodefornewlevel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: monCode, description: 'mythic'})
                });
            }
            if (sender.level == 7){
                message.member.roles.add(message.guild.roles.cache.find(r => r.name === `Actif ethereal`));
                await message.channel.send(`congrats: <@${message.author.id}> Est passé lvl ${sender.level}, a obtenu le role: Actif ethereal et gagne un ethereal de son choix`);
                const monCode = genererCode(16);
                await fetch('https://notabot-qecj.onrender.com/sendcodefornewlevel', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ code: monCode, description: 'ethereal'})
                });
            }
        }
    if (message.author.bot || !message.guild || !message.member) return;
    const isModo = message.member.roles.cache.some(r => ['Moderateur', 'Fondateur'].includes(r.name));
    const text = message.content;
    if (text.startsWith('/s0urceName')){
        const namewanted = text.slice('/s0urceName'.length).trim().toLowerCase();
        await S0urceUser.findOneAndUpdate(
            {s0urceName: namewanted},
            {s0urceName: namewanted, discordId: message.author.id },
            {upsert: true }
        );
        await message.reply('✅ Pseudo associé !');
    }
    if (text === '/s0urceHere'){
        if (!isModo){
            await message.channel.send('❌ Tu n\'as pas les permissions d\'administrateur pour utiliser cette commande !');
            return;
        }
        const config = await getConfig(message.guild.id);
        config.s0urcechannelid = message.channel.id;
        await config.save();
        await message.channel.send('OK, the s0urce infos will be here');
    }
    if (text === '/Announces') {
        const annonces = await Announce.find().sort({ _id: -1 }).limit(10);
        if (annonces.length === 0) {
            message.channel.send('pas d\'annonces');
            return; 
        }
        await message.channel.send('Ok here the Announces !');
        annonces.forEach((a, i) => {
            setTimeout(() => {
                message.channel.send(`${i + 1}: selled by: ${a.seller}  item: ${a.item}  price: ${a.price}  ${a.description}`);
            }, i * 500);
        });
    }
});
client.on('interactionCreate', async function(interaction){
    if (interaction.customId.startsWith('BUY')){
        const seller = interaction.customId.replace(`BUY | ',${a.item}, ''`);
        const known = await S0urceUser.findOne({ s0urceName: seller.toLowerCase() });
        if (known){
            interaction.reply('Cette personne n\'est pas sur discord je vais lui envoyer un s0urce mail');
            const mecname = interaction.username;
            const islinked = await S0urceUser.findOne({ discordId: interaction.user.id });
            if (islinked.s0urceName === seller.toLowerCase()) {
                return interaction.editReply('🤡 Tu ne peux pas acheter ta propre annonce !');
            }
            if (!islinked){
                await s0urceChannel.send(`@${mecname}, tu n'as pas associé ton nom de s0urce, fait le avec /s0urceName (ton nom s0urce) et re-cliques sur buy`);
            } else {
                await fetch('https://notabot-qecj.onrender.com/sendMailFromDiscord', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sender: islinked, to: known,})
                });
            }
            
        }
    }
});
app.post('/newAnnouce', async (req, res) => {
    res.sendStatus(200);
    const { names0urce, seller, item, price, description } = req.body;
    const known = await S0urceUser.findOne({ s0urceName: String(names0urce).toLowerCase() });
    if (!known) {
        console.log('pseudo non associé : ');
        return;
    }
    const config = await GuildConfig.findOne({ s0urcechannelid: { $ne: null } });
    if (!config){
        console.log('aucun salon défini avec /s0urceHere');
        return;
    }
    const channel = await client.channels.fetch(config.s0urcechannelid);
    await SendNewAnnounce(channel, { seller, item, price, description });
});
app.post('/newRecord'), async (req, res) => {
    res.sendStatus(200);
    const { namegame, record, port} = req.boy;
    const known = await S0urceUser.findOne({ s0urceName: String(namegame).toLowerCase() });
    if (known){
        await s0urceChannel.send(`@NotifNewRecord, a New record was created on port: ${port} on ${record}sec by @${known} | ${sender} (discord name | in-game Pseudo)`)       
    }
    await s0urceChannel.send(`@NotifNewRecord, a New record was created on port: ${port} on ${record}sec by ${namegame} (only s0urce Pseudo, can't know his discord name)`)
}
