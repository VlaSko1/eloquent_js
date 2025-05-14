const {createServer} = require("http");
let server = createServer((request, response) => {
    response.writeHead(200, {"Content-Type": "text/html"});
    response.write(`
        <doctype html>
        <head><meta charset="utf-8">
        </head>
        <body>
        <h1>Привет!</h1>
        <p>Вы искали <code>${request.url}</code></p>
        </body>
        
    `);
    response.end();
});
server.listen(8000);
console.log("Начинаем слушать! (port 8000)");