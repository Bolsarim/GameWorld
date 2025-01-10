// Importa o plugin Flip da GSAP
gsap.registerPlugin(Flip);

// Seletores dos elementos principais
const body = document.body;
const content = document.querySelector(".content");
const grid = document.querySelector(".grid");
const gridRows = grid.querySelectorAll(".row");

// Cache do tamanho da janela e atualização no redimensionamento
let winsize = { width: window.innerWidth, height: window.innerHeight };
window.addEventListener("resize", () => {
  winsize = { width: window.innerWidth, height: window.innerHeight };
});

// Posição do mouse inicializada no centro da janela
let mousepos = { x: winsize.width / 2, y: winsize.height / 2 };

// Configuração para habilitar/desabilitar animações
const config = {
  translateX: true,
  skewX: false,
  contrast: true,
  scale: false,
  brightness: true
};

// Número total de linhas
const numRows = gridRows.length;
// Calcula a linha do meio assumindo um número ímpar de linhas
const middleRowIndex = Math.floor(numRows / 2);

const middleRow = gridRows[middleRowIndex];
const middleRowItems = middleRow.querySelectorAll(".row__item");
const numRowItems = middleRowItems.length;
const middleRowItemIndex = Math.floor(numRowItems / 2); // Índice do item do meio na linha do meio
const middleRowItemInner = middleRowItems[middleRowItemIndex].querySelector(
  ".row__item-inner"
);
const middleRowItemInnerImage = middleRowItemInner.querySelector(
  ".row__item-img"
);
middleRowItemInnerImage.classList.add("row__item-img--large");

// Configuração de interpolação para movimento de cada linha
const baseAmt = 0.1; // Interpolação mais rápida para a linha do meio
const minAmt = 0.05; // Valor mínimo para garantir movimento perceptível
const maxAmt = 0.1; // Valor máximo para garantir movimento perceptível

// Inicializa estilos renderizados para cada linha
let renderedStyles = Array.from({ length: numRows }, (v, index) => {
  const distanceFromMiddle = Math.abs(index - middleRowIndex);
  const amt = Math.max(baseAmt - distanceFromMiddle * 0.03, minAmt);
  const scaleAmt = Math.min(baseAmt + distanceFromMiddle * 0.03, maxAmt);
  let style = { amt, scaleAmt };

  if (config.translateX) {
    style.translateX = { previous: 0, current: 0 };
  }
  if (config.skewX) {
    style.skewX = { previous: 0, current: 0 };
  }
  if (config.contrast) {
    style.contrast = { previous: 100, current: 100 };
  }
  if (config.scale) {
    style.scale = { previous: 1, current: 1 };
  }
  if (config.brightness) {
    style.brightness = { previous: 100, current: 100 };
  }

  return style;
});

// Tracks if the render loop is running
let requestId;

// Função para obter a posição do mouse
const getMousePos = (ev) => {
  let posx = 0;
  let posy = 0;
  if (!ev) ev = window.event;
  if (ev.pageX || ev.pageY) {
    posx = ev.pageX;
    posy = ev.pageY;
  } else if (ev.clientX || ev.clientY) {
    posx =
      ev.clientX +
      document.body.scrollLeft +
      document.documentElement.scrollLeft;
    posy =
      ev.clientY + document.body.scrollTop + document.documentElement.scrollTop;
  }
  return { x: posx, y: posy };
};

// Atualiza a posição do mouse
const updateMousePosition = (ev) => {
  const pos = getMousePos(ev);
  mousepos.x = pos.x;
  mousepos.y = pos.y;
};

// Função de interpolação linear
const lerp = (a, b, n) => (1 - n) * a + n * b;

// Mapeia a posição do mouse para a faixa de translação
const calculateMappedX = () => {
  return (((mousepos.x / winsize.width) * 2 - 1) * 40 * winsize.width) / 100;
};

// Mapeia a posição do mouse para a faixa de contraste
const calculateMappedContrast = () => {
  const centerContrast = 100;
  const edgeContrast = 330;
  const t = Math.abs((mousepos.x / winsize.width) * 2 - 1);
  const factor = Math.pow(t, 2);
  return centerContrast - factor * (centerContrast - edgeContrast);
};

// Mapeia a posição do mouse para a faixa de brilho
const calculateMappedBrightness = () => {
  const centerBrightness = 100;
  const edgeBrightness = 15;
  const t = Math.abs((mousepos.x / winsize.width) * 2 - 1);
  const factor = Math.pow(t, 2);
  return centerBrightness - factor * (centerBrightness - edgeBrightness);
};

// Renderiza o quadro atual
const render = () => {
  const mappedValues = {
    translateX: calculateMappedX(),
    contrast: calculateMappedContrast(),
    brightness: calculateMappedBrightness()
  };

  // Calcula e define a translação para cada linha
  gridRows.forEach((row, index) => {
    const style = renderedStyles[index];

    // Atualiza posições atuais e interpola valores
    for (let prop in config) {
      if (config[prop]) {
        style[prop].current = mappedValues[prop];
        const amt = prop === "scale" ? style.scaleAmt : style.amt;
        style[prop].previous = lerp(
          style[prop].previous,
          style[prop].current,
          amt
        );
      }
    }

    // Aplica os valores interpolados
    let gsapSettings = {};
    if (config.translateX) gsapSettings.x = style.translateX.previous;
    if (config.contrast)
      gsapSettings.filter = `contrast(${style.contrast.previous}%)`;
    if (config.brightness)
      gsapSettings.filter = `${
        gsapSettings.filter ? gsapSettings.filter + " " : ""
      }brightness(${style.brightness.previous}%)`;

    gsap.set(row, gsapSettings);
  });

  // Continua o loop de renderização
  requestId = requestAnimationFrame(render);
};

// Inicia o loop de renderização
const startRendering = () => {
  if (!requestId) {
    render();
  }
};

// Inicialização
const init = () => {
  startRendering();
};

// Listener de movimento do mouse
window.addEventListener("mousemove", updateMousePosition);
// Listener de movimento em dispositivos touch
window.addEventListener("touchmove", (ev) => {
  const touch = ev.touches[0];
  updateMousePosition(touch);
});

const initSmoothScrolling = () => {
  // Inicializa Lenis para efeitos de rolagem suave
  const lenis = new Lenis({ lerp: 0.15 });

  // Sincroniza animações GSAP com os quadros de rolagem do Lenis
  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  // Desativa o ajuste de lag padrão do GSAP para evitar conflitos
  gsap.ticker.lagSmoothing(0);
};

// Ativa o recurso de rolagem suave
initSmoothScrolling();

// Chama a função de inicialização
init();


