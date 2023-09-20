onmessage = event => {
    postMessage(event.data * event.data);
};