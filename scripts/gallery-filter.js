// ===== Gallery Filter Logic =====
document.addEventListener("DOMContentLoaded", () => {
  const filterButtonsContainer = document.querySelector(".filter-buttons");
  const galleryItems = document.querySelectorAll(".gallery-grid .gallery-item");

  if (!filterButtonsContainer || galleryItems.length === 0) {
    // Exit if required elements are not found
    return;
  }

  filterButtonsContainer.addEventListener("click", (event) => {
    // Use event delegation to handle clicks on buttons
    const clickedButton = event.target.closest(".filter-btn");
    if (!clickedButton) return;

    const filterValue = clickedButton.dataset.filter;

    // Update active state on buttons
    filterButtonsContainer
      .querySelector(".filter-btn.active")
      .classList.remove("active");
    clickedButton.classList.add("active");

    // Filter the gallery items
    galleryItems.forEach((item) => {
      const itemCategory = item.dataset.category;

      // Show item if filter is 'all' or if item's category matches the filter
      if (filterValue === "all" || itemCategory === filterValue) {
        item.style.display = "flex"; // Use 'flex' as it's the default display for gallery-item
      } else {
        item.style.display = "none"; // Hide item if it doesn't match
      }
    });
  });
});
