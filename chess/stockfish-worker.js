/* Bablo Chess Stockfish worker bridge. Stockfish.js is GPL-3.0. */
self.Module = self.Module || {};
self.Module.locateFile = function(path) {
  return 'https://cdn.jsdelivr.net/npm/stockfish@19.0.1/' + path;
};
importScripts('https://cdn.jsdelivr.net/npm/stockfish@19.0.1/stockfish-19-lite-single.js');
