const { FusesPlugin } = require('@electron-forge/plugin-fuses');


const { FuseV1Options, FuseVersion } = require('@electron/fuses');

module.exports = {
  // Config del empaquetador
  packagerConfig: {
    asar: true, // Esto mete todos los archivos de la app en un solo archivo ASAR (como un zip)
  },


  rebuildConfig: {},


  makers: [
    {
      name: '@electron-forge/maker-squirrel', // Instalador para Windows
      config: {}, // No le pusimos nada especial
    },
    {
      name: '@electron-forge/maker-zip', // Genera un ZIP de la app
      platforms: ['darwin'], // Solo para macOS
    },
    {
      name: '@electron-forge/maker-deb', // Para Linux (Debian, Ubuntu)
      config: {}, 
    },
    {
      name: '@electron-forge/maker-rpm', // Para Linux tipo Red Hat
      config: {},
    },
  ],

  // Plugins que le metemos a Electron Forge
  plugins: [
    {
      name: '@electron-forge/plugin-auto-unpack-natives', 
      config: {}, // Este se encarga de que los módulos nativos funcionen bien
    },
    new FusesPlugin({
      version: FuseVersion.V1, // Usamos la versión 1 de Fuses
      // Opciones que activamos o desactivamos:
      [FuseV1Options.RunAsNode]: false, // La app no puede ejecutarse como Node.js
      [FuseV1Options.EnableCookieEncryption]: true, // Las cookies van a ir encriptadas
      [FuseV1Options.EnableNodeOptionsEnvironmentVariable]: false, // No dejamos que se use la variable NODE_OPTIONS
      [FuseV1Options.EnableNodeCliInspectArguments]: false, // Bloquea los argumentos de inspección de Node
      [FuseV1Options.EnableEmbeddedAsarIntegrityValidation]: true, // Verifica que el ASAR no esté modificado
      [FuseV1Options.OnlyLoadAppFromAsar]: true, // Solo se puede cargar la app desde el ASAR
    }),
  ],
};
