const {writeFile} = require("fs");
writeFile("file.txt", "Здесь был node", err => {
    if (err) console.log(`Не удалось записать файл: ${err}`);
    else console.log("Файл записан.");
});