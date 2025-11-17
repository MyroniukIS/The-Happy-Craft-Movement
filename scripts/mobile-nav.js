// ===== Mobile Navigation Logic =====
(function () {
  const navToggle = document.querySelector(".mobile-nav-toggle");
  const primaryNav = document.querySelector(".mobile-nav");

  if (!navToggle || !primaryNav) {
    // Exit if elements are not found
    return;
  }

  navToggle.addEventListener("click", () => {
    const isVisible = primaryNav.getAttribute("data-visible") === "true";
    if (isVisible) {
      primaryNav.setAttribute("data-visible", "false");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    } else {
      primaryNav.setAttribute("data-visible", "true");
      navToggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("no-scroll");
    }
  });

  // Close menu when a link is clicked
  primaryNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      primaryNav.setAttribute("data-visible", "false");
      navToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("no-scroll");
    });
  });
})();
