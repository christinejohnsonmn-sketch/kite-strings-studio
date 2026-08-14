// ==========================================================================
// Kite Strings Studio — The Landing store
// One shared list of caught thoughts, visible from every room, any day.
// ==========================================================================
window.KSDLanding = (function () {
  // Key intentionally kept as the original "parking-lot" name so anything
  // already pinned before this page was renamed to The Landing isn't lost.
  const KEY = 'ksd-parking-lot';

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      const items = raw ? JSON.parse(raw) : [];
      return Array.isArray(items) && items.length > 0 ? items : [''];
    } catch (err) {
      return [''];
    }
  }

  function save(items) {
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
      return true;
    } catch (err) {
      console.error('The Landing storage error:', err);
      return false;
    }
  }

  return { load, save };
})();
