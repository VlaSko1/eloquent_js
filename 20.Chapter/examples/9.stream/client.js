const {request} = require("http");
request({
    hostname: "localhost",
    path: "/",
    port: 8000,
    method: "POST",
}, response => {
    response.on("data", chunk => 
        process.stdout.write(chunk.toString()));
}).end("Hello server");