// Important Packages
const events = require('events');
const { waitFor } = require("wait-for-event")
const fs = require("fs")
const express = require("express")
const path = require("path")
const multer = require("multer")
const cookieParser = require('cookie-parser');

// Local Files
const config = require("./config")
const colors = require("./colors");

const eventEmitter = new events.EventEmitter();
module.exports = eventEmitter
const discord = require("./discord");
let loopback = null
eventEmitter.on("activated", (service) => {
  console.log(colors("green", "[Modules]") + " Bot initializing")
})
eventEmitter.on("loopback-index", (data) => {
  loopback = data;
})
eventEmitter.on("sendback-file", (data) => {
  loopback = data
})


const app = express()
app.use(cookieParser());
const generate = require('retronid').generate;

app.set("views", path.join(__dirname, "views"))
app.set("view engine", "ejs")

// var upload = multer({ dest: "Upload_folder_name" })
// If you do not want to use diskStorage then uncomment it

var storage = multer.diskStorage({
  destination: function(req, file, cb) {

    // Uploads is the Upload_folder_name
    cb(null, "uploads")
  },
  filename: function(req, file, cb) {
    eventEmitter.emit("loopback-index", file.originalname.split("."))
    cb(null, req.__retronbv.id + "." + file.originalname.split(".").at(-1))
  }
})

// Define the maximum size for uploading
// picture i.e. 7.9 MB. it is optional
const maxSize = 7.9 * 1000 * 1000;


var upload = multer({
  storage: storage,
  limits: { fileSize: maxSize },
  fileFilter: function(req, file, cb) {
    return cb(null, true)
  }

  // mypic is the name of file attribute
}).single("image");

app.get("/", function(req, res) {
  if (req.cookies.auth) {
    res.render("index", { auth: true, token: req.cookies.auth });
  } else {
    res.render("index", { auth: false, token: req.cookies.auth })
  }

})

app.get("/upload", function(req, res) {
  res.render("upload");
})

app.get("/api/setAuthCookie", (req, res) => {
  let options = {
    maxAge: 604800000, // would expire after 15 minutes
    httpOnly: false, // The cookie only accessible by the web server
    signed: false // Indicates if the cookie should be signed
  }
  res.cookie("auth", generate(), options)
  res.redirect("/")
})

app.get("/api/getAuthCookie", (req, res) => {
  res.send(req.cookies)
})

app.get("/api/clearAuthCookie", (req, res) => {
  res.clearCookie("auth")
  res.redirect("/")
})

app.post("/upload/post", function(req, res, next) {
  if (req.headers['x-forwarded-for'].includes("76.16.222.153")) {
    res.send("stop!!!")
    return "sus"
  }
  if (req.cookies === {}) {
    let options = {
      maxAge: 604800000, // would expire after 15 minutes
      httpOnly: false, // The cookie only accessible by the web server
      signed: false // Indicates if the cookie should be signed
    }
    res.cookie("auth", generate(), options)
    res.redirect("/upload/post")
  }
  /*
  fs.appendFile('log.txt', req.headers['x-forwarded-for']+"\n", function (err) {
  if (err) {
    // append failed
  } else {
    // done
  }
})
  */
  let id = generate();
  //console.log(id)
  // Error MiddleWare for multer file upload, so if any
  // error occurs, the image would not be uploaded!
  req.__retronbv = {
    id: id
  }
  upload(req, res, function(err, ext) {

    if (err) {

      // ERROR occured (here it can be occured due
      // to uploading image of size greater than
      // 1MB or uploading different file type)
      res.send(err)
    }
    else {

      // SUCCESS, image successfully uploaded
      res.redirect("/view/" + id + "." + loopback.at(-1))
      let ext = loopback.at(-1)
      loopback.pop(-1)
      eventEmitter.emit("fileUpload", [id, [loopback.join(".") + "." + ext, ext], req.cookies])
    }
  })
})


app.get('/view/:id.:fileext', async (req, res) => {
  eventEmitter.emit("fileView", [req.params.id, req.params.fileext, res])
  await waitFor('sendback-file', eventEmitter).then(() => {
    //console.log(loopback)
    filename = loopback[1].split("/").slice(-1)[0]
    //console.log(filename)
    res.sendFile(__dirname + "/uploads/" + filename, (err) => {
      if (err) {
        console.error(err)
      } else {
        //fs.unlinkSync("./uploads/"+filename)
        console.log("deleted file")
      }
    });
  })

  //res.sendFile(__dirname+"/uploads/"+req.params.id+"."+req.params.fileext);
})
eventEmitter.on("fileDeleted", (data) => {
  loopback = data
})
eventEmitter.on("dashboardList-loopback", (data) => {
  loopback = data
})
app.get('/delete/:id.:fileext', async (req, res) => {
  eventEmitter.emit("fileDelete", [req.params.id, req.params.fileext, req.cookies])
  await waitFor('fileDeleted', eventEmitter).then(() => {
    console.log(loopback)
    if (loopback[0] === "ok") {
      res.redirect("/dashboard")
    } else if (loopback[0] === "bad-auth") {
      res.send("not authorized")
    }
  })

  //res.sendFile(__dirname+"/uploads/"+req.params.id+"."+req.params.fileext);
})
app.get('/dashboard', async (req, res) => {
  if (req.cookies === {}) {
    let options = {
      maxAge: 604800000, // would expire after 15 minutes
      httpOnly: false, // The cookie only accessible by the web server
      signed: false // Indicates if the cookie should be signed
    }
    res.cookie("auth", generate(), options)
    res.redirect("/dashboard")
  }
  eventEmitter.emit("dashboardList", req.cookies)
  await waitFor('dashboardList-loopback', eventEmitter).then(() => {
    //console.log(loopback)
    res.render("dashboard", { files: loopback[0] })
  })

  //res.sendFile(__dirname+"/uploads/"+req.params.id+"."+req.params.fileext);
})

// Take any port number of your choice which
// is not taken by any other process
app.listen(config.port, function(error) {
  if (error) throw error
  console.log(colors("green", "[Modules]") + " Listening to port " + config.port)
})