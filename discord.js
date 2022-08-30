// Local Files
const events = require("./index");
const config = require("./config")
const colors = require("./colors");

const Discord = require('discord.js');
const client = new Discord.Client();
const download = require('download');
const fs = require("fs")
events.on("fileUpload", (infos) => {
  let channel = client.channels.cache.get(config.channel)
  channel.send({
    content: `-**${infos[0]}**- :[/]${infos[2].auth} ;[/]${infos[1].at(0)}`, files: [
      "./uploads/" + infos[0] + "." + infos[1].at(-1)
    ]
  }).then(() => {
    fs.unlinkSync("./uploads/" + infos[0] + "." + infos[1].at(-1))
    console.log(colors("green", "[Logs] ") + "deleted file")
  })
})
events.on("dashboardList", (infos) => {
  let channel = client.channels.cache.get(config.channel)
  let check = `:[/]${infos.auth}`
  channel.messages.fetch().then(msgs => { // Get messages to check
    let msglog = msgs.array() // Make an array with all the messages fetched
    console.log(colors("green", "[Logs] ") + msglog)
    let list = []

    for (const element of msglog) {
      if (element.content.includes(check)) {
        channel.messages.fetch(element.id).then((msg) => {
          list.push(element)
        });

      }
    }
    console.log(colors("green", "[Logs] ") + list)
    // console.log(colors("green", "[Logs] ") + list.length)
    events.emit("dashboardList-loopback", [list, infos])
  });
})
events.on("fileDelete", (infos) => {
  let channel = client.channels.cache.get(config.channel)
  let check = `-**${infos[0]}**- :[/]${infos[2].auth}`
  channel.messages.fetch().then(msgs => { // Get messages to check
    let msglog = msgs.array() // Make an array with all the messages fetched
    console.log(colors("green", "[Logs] ") + msglog)
    let list = []

    for (const element of msglog) {
      if (element.content.includes(check)) {
        channel.messages.fetch(element.id).then((msg) => {
          list.push(element)
          msg.delete()
          events.emit("fileDeleted", ["ok", infos])
        });

      }
    }
    console.log(colors("green", "[Logs] ") + list)
    console.log(colors("green", "[Logs] ") + list.length)
    if (list.length === 0) {
      events.emit("fileDeleted", ["bad-auth", infos])
    } else {
      console.log(colors("green", "[Logs] ") + "UHHHH " + list.length + ":" + (list.length === 0))
    }

  });
})
events.on("fileView", (infos) => {
  //console.log(infos)
  let channel = client.channels.cache.get(config.channel)
  console.log(colors("green", "[Logs] ") + channel)
  let check = `-**${infos[0]}**-`; // Condition, in this case if it containts a certain string
  console.log(colors("green", "[Logs] ") + check)
  channel.messages.fetch().then(msgs => { // Get messages to check
    let msglog = msgs.array() // Make an array with all the messages fetched
    console.log(colors("green", "[Logs] ") + msglog)
    for (const element of msglog) {
      if (element.content.includes(check)) {
        console.log(colors("green", "[Logs] ") + element.attachments.array()[0])


        // Url of the image
        const file = element.attachments.array()[0].attachment;
        // Path at which image will get downloaded
        const filePath = `${__dirname}/uploads`;

        download(file, filePath)
          .then(() => {
            console.log(colors("green", "[Logs] ") + 'Download Completed');
            events.emit("sendback-file", [filePath + "/" + file, file])
          })
      }
    }

  });
})

client.on('ready', async () => {
  console.log(colors("green", "[Modules] ") + `Logged as ${client.user.tag}`)
  events.emit("activated", "discord")
});


client.login(process.env.token)