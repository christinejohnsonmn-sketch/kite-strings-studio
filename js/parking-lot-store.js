// ==========================================================================
// Kite Strings Studio — Parking Lot store
// One shared list of caught thoughts, visible from every room, any day.
// ==========================================================================
window.KSDParkingLot = (function () {
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
      console.error('Parking Lot storage error:', err);
      return false;
    }
  }

  return { load, save };
})();
