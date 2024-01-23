function setActiveMenu(currentUrl, menuUrl) {
  return currentUrl === menuUrl ? "active" : "";
}

module.exports = {
  setActiveMenu,
};
