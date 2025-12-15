// === ЛОГІКА ДАТИ: Перевіряємо, чи потрібно показувати сніг ===
const today = new Date();
const month = today.getMonth(); // 0 = січень, 11 = грудень
const day = today.getDate();

// Умова: з 1 грудня (місяць 11) до 3 січня (місяць 0)
const isWinterSeason = (month === 11 && day >= 1) || (month === 0 && day <= 3);

// Якщо зараз не сезон, нічого не робимо
if (!isWinterSeason) {
  // Можна повністю приховати canvas, хоча він і так невидимий
  const canvas = document.getElementById("snow-canvas");
  if (canvas) {
    canvas.style.display = "none";
  }
} else {
  // === ЛОГІКА АНІМАЦІЇ: Якщо сезон, запускаємо снігопад ===

  const canvas = document.getElementById("snow-canvas");
  const ctx = canvas.getContext("2d");

  // Встановлюємо розмір полотна відповідно до розміру вікна
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Налаштування сніжинок
  const snowflakeCount = 150; // Кількість сніжинок
  const snowflakes = [];

  // Створюємо масив сніжинок з випадковими параметрами
  for (let i = 0; i < snowflakeCount; i++) {
    snowflakes.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      radius: Math.random() * 3 + 1, // Розмір сніжинок
      speed: Math.random() * 2 + 0.5, // Швидкість падіння
      drift: Math.random() * 2 - 1, // Рух вліво/вправо
    });
  }

  // Функція для малювання однієї сніжинки
  function drawSnowflake(flake) {
    ctx.beginPath();
    ctx.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)"; // Білий колір з легкою прозорістю
    ctx.fill();
  }

  // Функція для оновлення позицій сніжинок
  function updateSnowflakes() {
    for (let flake of snowflakes) {
      // Рухаємо сніжинку вниз
      flake.y += flake.speed;
      // Додаємо невеликий зсув по горизонталі
      flake.x += flake.drift;

      // Якщо сніжинка вийшла за межі екрану, повертаємо її нагору
      if (flake.y > canvas.height) {
        flake.x = Math.random() * canvas.width;
        flake.y = -flake.radius; // Починаємо трохи вище екрану
      }
      // Якщо сніжинка вийшла за межі по горизонталі, повертаємо її з іншого боку
      if (flake.x > canvas.width + flake.radius) {
        flake.x = -flake.radius;
      } else if (flake.x < -flake.radius) {
        flake.x = canvas.width + flake.radius;
      }
    }
  }

  // Головний цикл анімації
  function animationLoop() {
    // Очищуємо полотно перед кожним кадром
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Малюємо кожну сніжинку
    snowflakes.forEach(drawSnowflake);

    // Оновлюємо їх позиції для наступного кадру
    updateSnowflakes();

    // Запускаємо цю функцію знову для наступного кадру
    requestAnimationFrame(animationLoop);
  }

  // Запускаємо анімацію
  animationLoop();

  // Обробник зміни розміру вікна, щоб анімація виглядала добре при ресайзі
  window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  });
}
