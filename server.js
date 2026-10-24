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
        .setCustomId('BUY')
        .setLabel('BUY')
        .setEmoji('🤑')
        .setStyle(ButtonStyle.Secondary);

    row.addComponents(BUYIT);

    await s0urceChannel.send('@notifAnnounces, il y a une nouvelle annonce');
    setTimeout(() => s0urceChannel.send({ embeds: [CreatenewAnnounceEmbed], components: [row] }), 200);
};
client.on('messageCreate', async function(message){
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
    if (text.startsWith('/Announces')) {
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