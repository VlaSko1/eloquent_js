let { readFile } = require("fs");

readFile("file.txt", (error, buffer) => {
    if (error) throw error;
    console.log("Файл содержит", buffer.length, "байт",
        "Первый байт:", buffer[0]
    );
});