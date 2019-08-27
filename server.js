const express = require('express');
const fileUpload = require("express-fileupload");
const server = express();

// enable file uploads
server.use(fileUpload());
server.post('/upload', function(req, res) {

    console.log(req.files);

    if (req.files == null || Object.keys(req.files).length == 0) {
      return res.status(400).send('No files were uploaded.');
    }
  
    // Use the mv() method to place the file somewhere on your server
    req.files.f.mv('upload/' + req.files.f.name, function(err) {
      if (err)
        return res.status(500).send(err);
  
      res.send('/upload/' + req.files.f.name);
    });
});

// server static files
server.use(express.static("./"));

server.listen(4245);