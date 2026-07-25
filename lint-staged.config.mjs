// lint-staged pasa la lista de archivos staged como argumentos del comando. En Windows la
// línea de comandos tiene un límite duro de ~8191 caracteres, y con rutas absolutas eso se
// alcanza alrededor de los 50 archivos: el commit falla con "La línea de comandos es demasiado
// larga" en vez de con un error de lint, que es de las cosas más confusas de diagnosticar.
//
// Por encima del umbral se corre la herramienta sobre todo el repo (una sola invocación, sin
// argumentos). Es más lento, pero un commit de 40+ archivos ya no es el caso que este hook
// intenta acelerar; el caso que importa —cambiar dos o tres archivos— sigue siendo instantáneo.
const UMBRAL_ARCHIVOS = 40;

/**
 * Arma el comando con los archivos.
 *
 * Cuando la config de lint-staged es una función, lint-staged NO agrega los archivos solo: el
 * comando devuelto se ejecuta tal cual. Por eso hay que citarlos acá — y hay que hacerlo de
 * verdad, no con un join por espacios: la ruta de este proyecto contiene espacios
 * ("Proyectos de Desarrollo") y sin comillas cada palabra llegaría como un argumento distinto.
 */
const conArchivos = (comando, archivos) =>
  `${comando} -- ${archivos.map((archivo) => JSON.stringify(archivo)).join(" ")}`;

export default {
  "*.{ts,tsx}": (archivos) =>
    archivos.length > UMBRAL_ARCHIVOS
      ? ["eslint --fix .", "prettier --write ."]
      : [
          conArchivos("eslint --fix", archivos),
          conArchivos("prettier --write", archivos),
        ],

  "*.{json,md,css,mjs,mts,yml,yaml}": (archivos) =>
    archivos.length > UMBRAL_ARCHIVOS
      ? ["prettier --write ."]
      : [conArchivos("prettier --write", archivos)],
};
