# Discord to Minecraft chat bot

Make the chat on your Minecraft server appear on your Discord server, and the other way around.


## Installation

First you set up a Minecraft server like you normally would, [then create a Discord bot account](https://discord.com/developers) and [add it to your server](https://discordapi.com/permissions.html).
Install [node.js](https://nodejs.org/en/), if you are using linux, your distro may not install the newest version. 
If that happens you'll have to search how to install the newest version for your distro.
Then you place the `index.js` and `config.json` in the same folder as your Minecraft server.
The `config.json` file needs the token for your Discord bot and a channel id for which channel in your server it has to send messages in and read messages from. 
You can copy the bot token from where you created the account for the bot (do not share this token with anyone or else they'll be able to control the bot) and paste it in the `config.json` file. 
To get the id of a channel you have to enable developer mode in Discord (settings > app settings > appearance > developer mode) then right click a channel and click "copy id" and paste it in the `config.json` file as well and save it. 
Once that's done, you have to navigate to the folder in a terminal or CMD, then run "`npm init`". 
It should ask you for a few things, but you can just hold the enter key (unless there are multiple spaces in the folder name, in which case just type something and press enter).
Then run "`npm install discord.js`" and "`npm install node-pty`" (on windows, node-pty requires visual studio to be installed with c++ development tools, you can probably work around this by using WSL, which is more complicated to set up), iirc it may ask you for confirmation to continue, just type y and press enter.
That's it, you can now start the server and bot by typing "`node .`".


###### A few things to note

It works by letting the node.js process create a new shell (terminal/powershell), you can't type in the window because of this, you'll have to use the server UI.
And if you want to make modifications to the script, please note that the way it works is by taking discord chat messages as input and running those as commands in the shell.
This means that if you edit something wrong people on the discord server may be able to run commands on your computer.
