
function updateState(state, action) {
  return { ...state, ...action };
}

function elt(type, props, ...children) {
  let dom = document.createElement(type);
  if (props) Object.assign(dom, props);
  for (let child of children) {
    if (typeof child != "string") dom.appendChild(child);
    else dom.appendChild(document.createTextNode(child));
  }
  return dom;
}

function drawPicture(picture, canvas, scale, previous /*oldPicture = null*/) {
  if (
    previous == null ||
    previous.width != picture.width ||
    previous.height != picture.height
  ) {
    canvas.width = picture.width * scale;
    canvas.height = picture.height * scale;
    previous = null;
  }

  let cx = canvas.getContext("2d");
  for (let y = 0; y < picture.height; y++) {
    for (let x = 0; x < picture.width; x++) {
      let color = picture.pixel(x, y);
      if (previous == null || previous.pixel(x, y) != color) {
        cx.fillStyle = color;
        cx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

function pointerPosition(pos, domNode) {
  let rect = domNode.getBoundingClientRect();
  return {
    x: Math.floor((pos.clientX - rect.left) / scale),
    y: Math.floor((pos.clientY - rect.top) / scale),
  };
}

function draw(pos, state, dispatch) {
  function drawPixel({ x, y }, state) {
    let drawn = { x, y, color: state.color };
    dispatch({ picture: state.picture.draw([drawn]) });
  }
  drawPixel(pos, state);
  return drawPixel;
}

function rectangle(start, state, dispatch) {
  function drawRectangle(pos) {
    let xStart = Math.min(start.x, pos.x);
    let yStart = Math.min(start.y, pos.y);
    let xEnd = Math.max(start.x, pos.x);
    let yEnd = Math.max(start.y, pos.y);
    let drawn = [];
    for (let y = yStart; y <= yEnd; y++) {
      for (let x = xStart; x <= xEnd; x++) {
        drawn.push({ x, y, color: state.color });
      }
    }
    dispatch({ picture: state.picture.draw(drawn) });
  }
  drawRectangle(start);
  return drawRectangle;
}

function circle(start, state, dispatch) {
  function drawCircle(pos) {
    // находим координаты противоположной точки окружности от точки растягивания
    let [xStart, xCenter, xEnd, yStart, yCenter, yEnd] = getCircleData(
      start.x,
      start.y,
      pos.x,
      pos.y
    );
    let drawn = [];
    let radius = distBetPoints(xStart, xCenter, yStart, yCenter);
    // ширина и высота полотна для рисования
     let realWidth = state.picture.width;
     let realHeight = state.picture.height;
    // Находим координаты квадрата в который будет вписываться наш круг
    let xStartSquare = xCenter - radius;
    let xEndSquare = xCenter + radius;
    let yStartSquare = yCenter - radius;
    let yEndSquare = yCenter + radius;
    // Делаем проверку длины радиуса круга, что бы круг не выходил за холст
    radius = Math.min(
      radius,
      distBetPoints(0, xCenter, yCenter, yCenter),
      distBetPoints(xCenter, realWidth, yCenter, yCenter),
      distBetPoints(xCenter, xCenter, 0, yCenter),
      distBetPoints(xCenter, xCenter, yCenter, realHeight)
    );
   
    for (let y = yStartSquare; y <= yEndSquare; y++) {
      for (let x = xStartSquare; x <= xEndSquare; x++) {
        if (distBetPoints(x, xCenter, y, yCenter) <= radius) {
          drawn.push({ x, y, color: state.color });
        }
      }
    }
    dispatch({ picture: state.picture.draw(drawn) });
  }
  function getCircleData(startX, startY, posX, posY) {
    const resultDataArr = [];
    if (startX >= posX) {
      resultDataArr.push(posX);
      resultDataArr.push(startX);
      resultDataArr.push(getOpp(startX, posX));
    } else {
      resultDataArr.push(getOpp(startX, posX));
      resultDataArr.push(startX);
      resultDataArr.push(posX);
    }
    if (startY >= posY) {
      resultDataArr.push(posY);
      resultDataArr.push(startY);
      resultDataArr.push(getOpp(startY, posY));
    } else {
      resultDataArr.push(getOpp(startY, posY));
      resultDataArr.push(startY);
      resultDataArr.push(posY);
    }
    return resultDataArr;
  }
  /**
   * Получает координату противоположной точки указателя мыши
   * @param {number} start - координата цента круга (неважно x или y)
   * @param {number} pos - координата указалетеля мыши
   * @returns {number} - координата точки противоположной точки с указателем мыши
   */
  function getOpp(start, pos) {
    return Math.floor(2 * start - pos);
  }

  function distBetPoints(xStart, xEnd, yStart, yEnd) {
    return Math.floor(
      Math.sqrt(Math.pow(xEnd - xStart, 2) + Math.pow(yEnd - yStart, 2))
    );
  }
  drawCircle(start);
  return drawCircle;
}

const around = [
  { dx: -1, dy: 0 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
];

function fill({ x, y }, state, dispatch) {
  let targetColor = state.picture.pixel(x, y);
  let drawn = [{ x, y, color: state.color }];
  let visited = new Set();
  for (let done = 0; done < drawn.length; done++) {
    for (let { dx, dy } of around) {
      let x = drawn[done].x + dx,
        y = drawn[done].y + dy;
      if (
        x >= 0 &&
        x < state.picture.width &&
        y >= 0 &&
        y < state.picture.height &&
        !visited.has(x + "," + y) &&
        state.picture.pixel(x, y) == targetColor
      ) {
        drawn.push({ x, y, color: state.color });
        visited.add(x + "," + y);
      }
    }
  }
  dispatch({ picture: state.picture.draw(drawn) });
}

function pick(pos, state, dispatch) {
  dispatch({ color: state.picture.pixel(pos.x, pos.y) });
}

function startLoad(dispatch) {
  let input = elt("input", {
    type: "file",
    onchange: () => finishLoad(input.files[0], dispatch),
  });
  document.body.appendChild(input);
  input.click();
  input.remove();
}

function finishLoad(file, dispatch) {
  if (file == null) return;
  let reader = new FileReader();
  reader.addEventListener("load", () => {
    let image = elt("img", {
      onload: () =>
        dispatch({
          picture: pictureFromImage(image),
        }),
      src: reader.result,
    });
  });
  reader.readAsDataURL(file);
}

function pictureFromImage(image) {
  let width = Math.min(100, image.width);
  let height = Math.min(100, image.height);
  let canvas = elt("canvas", { width, height });
  let cx = canvas.getContext("2d");
  cx.drawImage(image, 0, 0);
  let pixels = [];
  let { data } = cx.getImageData(0, 0, width, height);

  function hex(n) {
    return n.toString(16).padStart(2, "0");
  }
  for (let i = 0; i < data.length; i += 4) {
    let [r, g, b] = data.slice(i, i + 3);
    pixels.push("#" + hex(r) + hex(g) + hex(b));
  }
  return new Picture(width, height, pixels);
}

function historyUpdateState(state, action) {
  if (action.undo == true) {
    if (state.done.length == 0) return state;
    return {
      ...state,
      picture: state.done[0],
      done: state.done.slice(1),
      doneAt: 0,
    };
  } else if (action.picture && state.doneAt < Date.now() - 1000) {
    return {
      ...state,
      ...action,
      done: [state.picture, ...state.done],
      doneAt: Date.now(),
    };
  } else {
    return { ...state, ...action };
  }
}

function startPixelEditor({
  state = startState,
  tools = baseTools,
  controls = baseControls,
}) {
  let app = new PixelEditor(state, {
    tools,
    controls,
    dispatch(action) {
      state = historyUpdateState(state, action);
      app.syncState(state);
    },
  });
  return app.dom;
}