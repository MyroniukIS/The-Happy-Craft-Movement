// ===== Scroll to Top Button Logic =====
(function () {
  const scrollToTopBtn = document.getElementById("scrollToTopBtn");
  if (!scrollToTopBtn) return;

  window.addEventListener("scroll", () => {
    // Show button after scrolling down one viewport height
    scrollToTopBtn.setAttribute(
      "data-visible",
      window.scrollY > window.innerHeight
    );
  });

  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
})();
