const Discord = require('discord.js');

const bot = new Discord.Client();

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

bot.on('ready', () =>
{
    console.log(`Logged in as ${bot.user.tag}!`);
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

function SendData(FilteredData)
{
    process.stdout.write(FilteredData);
    bot.channels.cache.find(c => c.id == GameChatChannel).send(FilteredData);
}

bot.on('message', async message =>
{
    if (message.author.id == bot.user.id || !message.content || message.channel.id != GameChatChannel || ServerStopped)
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