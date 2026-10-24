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
const { config } = require('process');
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
let Announces = null;
const SendNewAnnounce = async function(s0urceChannel) {
    const CreatenewAnnounceEmbed = new EmbedBuilder()
        .setTitle('Nouvelle Annonce !')
        .setColor('#1E3A8A')
        .setDescription(newAnnounce);

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
    const isModo = message.member.roles.cache.includes('Moderateur || Fondateur');
    if (message.author.bot || !message.guild || !message.member) return;
    const text = message.content;
    if (text.startsWith('/s0urceName')){
        const namewanted = text.slice('/s0urceName'.length).trim().toLowerCase();
        await S0urceUser.findOneAndUpdate(
            {s0urceName: namewanted},
            {s0urceName: pseudo, discordId: message.author.id },
            {upsert: true }
        );
        await message.reply('✅ Pseudo associé !');
    }
    if (text.startsWith('/s0urceHere')){
        if (!isModo){
            await message.channel.send('❌ Tu n\'as pas les permissions d\'administrateur pour utiliser cette commande !');
        }
        config.s0urcechannelid = message.channel.id;
        s0urceChannel = message.channel;
        await config.save();
        if (s0urcechannel){
            await s0urcechannelid.send('OK, the s0urce infos will be here');
        }
    }
    if (text.startsWith('/Announces')){
        if (Announces != null) {
            await s0urceChannel.send('Ok here the Announces !');
            const annonces = await Announces.find().sort({ _id: -1 }).limit(10);
            annonces.forEach((annonce, i) => {
                setTimeout(() => {
                    s0urceChannel.send(id, sender, `${i + 1}: selled by: ${annonce.seller} item: ${annonce.item} price: ${annonce.price}, description: ${annonce.description}`)
                }, i * 100);
            });
        }
    }
});
app.post('/newAnnouce', async (req, res) => {
    res.sendStatus(200);
    const pseudo = (req.body.names0urce)
    const istheres0urcename = pseudo.findOne({s0urceName: pseudo})
    const newAnnounce = (req.body.newAnnounce);
    Announces = (req.body.Announce);
    if (istheres0urcename){
        if (s0urceChannel){
            SendNewAnnounce();
        } else {
            return;
        }
    }
});