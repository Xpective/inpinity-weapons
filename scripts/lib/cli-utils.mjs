export function hasFlag(flag) {
    return process.argv.includes(flag);
  }
  
  export function getArgValue(name, fallback = null) {
    const prefix = `${name}=`;
    const entry = process.argv.find((arg) => arg.startsWith(prefix));
    if (!entry) return fallback;
    return entry.slice(prefix.length);
  }