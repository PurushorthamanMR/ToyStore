let cache = null;

export function getHomeCache() {
  return cache;
}

export function setHomeCache(partial) {
  cache = { ...cache, ...partial };
}
