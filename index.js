const Discord = require('discord.js');

const bot = new Discord.Client();

const fetch = require('node-fetch');

const jimp = require('jimp');

const {token, GameChatChannel, StartCommand} = require('./config.json');

var shell = process.platform == 'win32' ? 'powershell.exe' : 'bash';

var ServerStopped = false;

var SavedChunks = 0;

var InfoLength = "[00:00:00] [Server thread/INFO]: ".length;

var pty = require('node-pty');

var ptyProcess = pty.spawn(shell, [], 
{
    name: 'xterm-color',
    cols: 100,
    rows: 40,
    cwd: process.cwd(),
    env: process.env
});

ptyProcess.write(`${StartCommand}\r`);

var webhook;

bot.on('ready', async () =>
{
    console.log(`Logged in as ${bot.user.tag}!`);

    var GameChannel = await bot.channels.cache.find(c => c.id == GameChatChannel);

    var AllWebhooks = (await GameChannel.fetchWebhooks()).array();

    if (AllWebhooks.length == 0)
        GameChannel.createWebhook("Minecraft Chat Webhook");

    for (var i = 0; i < AllWebhooks.length; i++)
    {
        if (AllWebhooks[i].name == "Minecraft Chat Webhook")
        {
            webhook = AllWebhooks[i];
            break;
        }
        else if (i == AllWebhooks.length - 1)
        {
            webhook = await GameChannel.createWebhook("Minecraft Chat Webhook");
            break;
        }
    }

    SendData("Server Starting");
});

ptyProcess.on('data', function(data)
{
    process.stdout.write(data);

    var FilteredData = data.toString();

    if ((FilteredData.slice(InfoLength).charAt(0) == "<" && FilteredData.includes(">")) 
    || (FilteredData.includes("joined the game") && !FilteredData.includes("tellraw")))
    {
        FilteredData = FilteredData.split("\n").join(" ");
        FilteredData = FilteredData.slice(InfoLength);

        SendData(FilteredData);
        return;
    }

    if (FilteredData.includes("left the game") && !FilteredData.includes("tellraw"))
    {
        FilteredData = FilteredData.split("\n")[0];
        FilteredData = FilteredData.slice(InfoLength);

        SendData(FilteredData);
        return;
    }

    if (FilteredData.includes("[Server thread/INFO]: Stopping the server") && !FilteredData.includes("<") && !FilteredData.includes("tellraw"))
    {
        ServerStopped = true;
        SendData("Server Stopped");
        return;
    }

    if (ServerStopped && FilteredData.includes("): All chunks are saved"))
    {
        SavedChunks++;

        if (SavedChunks == 6)
            setTimeout(() => process.exit(), 2000);
    }
});

async function SendData(FilteredData)
{
    process.stdout.write(FilteredData);

    if (FilteredData.includes("<"))
    {
        let username = FilteredData.split(" ")[0].slice(1, -1);
        
        webhook.send(FilteredData.slice(username.length + 2), {username: username, avatarURL: await GetPlayerIcon(username)});
    }
    else
        webhook.send(FilteredData, {username: "Server", avatarURL: bot.user.avatarURL()});
}

async function GetPlayerIcon(Username)
{
    await jimp.read(await StealSkin(Username))
    .then(image => 
    {
        image.crop(8, 8, 8, 8).resize(128, 128, jimp.RESIZE_NEAREST_NEIGHBOR).contain(128, 256).contain(256, 256).write('skin_face.png');
    })
    .catch(err =>
    {
        console.log(err);
    });

    return (await webhook.edit({avatar: "./skin_face.png"})).avatarURL();
}

async function StealSkin(Username)
{
    var SkinURL;

    try 
    {
        await fetch(`https://api.mojang.com/users/profiles/minecraft/${Username}`, {method: "Get"}).then(res => res.json())
        .then(async (json) =>
        {
            await fetch(`https://sessionserver.mojang.com/session/minecraft/profile/${json.id}/`, {method: "Get"}).then(res => res.json())
            .then(async (json) => {SkinURL = await JSON.parse(Buffer.from(json.properties[0].value, 'base64').toString()).textures.SKIN.url;});
        });
    } 
    catch (err) 
    {
        SkinURL = "http://textures.minecraft.net/texture/1a4af718455d4aab528e7a61f86fa25e6a369d1768dcb13f7df319a713eb810b";
    }

    return await SkinURL;
}

bot.on('message', async message =>
{
    if (message.author.bot || !message.content || message.channel.id != GameChatChannel || ServerStopped)
        return;

    var UserName = message.author.tag.slice(0, -5);

    if (message.member.nickname)
        UserName = message.member.nickname;

    var MessageText = `[${UserName}] ${message.content}`;

    if (message.content.includes("\\"))
        MessageText = MessageText.split("\\").join("\\\\");

    if (message.content.includes("\""))
        MessageText = MessageText.split("\"").join("\\\"");

    ptyProcess.write(`tellraw @a {"text":"${MessageText}"}\r`);
});

bot.login(token);