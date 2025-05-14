const {readFile} = require("fs").promises;
readFile("file.txt", "utf8")
    .then(text => console.log("Содержимое файла:", text));