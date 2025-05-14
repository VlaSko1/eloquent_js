const {readFileSync} = require("fs");
console.log("Содержимое файла:", readFileSync("file.txt", "utf8"));
