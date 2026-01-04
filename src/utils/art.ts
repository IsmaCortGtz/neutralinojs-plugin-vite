import c from 'picocolors';

export function getFiglet() {
  return `
  _   _            _             _ _             _
 | \\ | | ___ _   _| |_ _ __ __ _| (_)_ __   ___ (_)___
 |  \\| |/ _ \\ | | | __| '__/ _' | | | '_ \\ / _ \\| / __|
 | |\\  |  __/ |_| | |_| | | (_| | | | | | | (_) | \\__ \\
 |_| \\_|\\___|\\__,_|\\__|_|  \\__,_|_|_|_| |_|\\___// |___/
                                               |__/\n`;
}

export function printHeader() {
  console.log('\n', c.yellow(c.bold('Welcome to neutralinojs-plugin-vite')));
  console.log(c.yellow(getFiglet()));
}