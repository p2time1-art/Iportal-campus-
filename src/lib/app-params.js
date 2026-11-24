/// <reference types="vite/client" />

const isNode = typeof window === "undefined";
const storage = isNode ? null : window.localStorage;

const toSnakeCase = (str) => str.replace(/([A-Z])/g, "_$1").toLowerCase();

const getAppParamValue = (paramName, { defaultValue = undefined, removeFromUrl = false } = {}) => {
  if (isNode || !storage) {
    return defaultValue;
  }
  const storageKey = `iportal_${toSnakeCase(paramName)}`;
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get(paramName);
  if (removeFromUrl) {
    urlParams.delete(paramName);
    const newUrl = `${window.location.pathname}${urlParams.toString() ? `?${urlParams.toString()}` : ""}${window.location.hash}`;
    window.history.replaceState({}, document.title, newUrl);
  }
  if (searchParam) {
    storage.setItem(storageKey, searchParam);
    return searchParam;
  }
  if (defaultValue) {
    storage.setItem(storageKey, defaultValue);
    return defaultValue;
  }
  return storage.getItem(storageKey) || null;
};

export const appParams = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || "/api/v1",
  schoolSlug: getAppParamValue("school"),
};
