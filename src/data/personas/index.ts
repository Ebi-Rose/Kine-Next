export { loadSarah } from "./sarah";
export { loadMia } from "./mia";
export { loadPriya } from "./priya";
export { loadAisha } from "./aisha";
export { loadEmma } from "./emma";
export { loadDiane } from "./diane";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loader = (store: any) => void;

/** Map from persona access code suffix to loader function */
export const PERSONA_LOADERS: Record<string, Loader> = {
  sarah: (s) => loadSarah(s),
  mia: (s) => loadMia(s),
  priya: (s) => loadPriya(s),
  aisha: (s) => loadAisha(s),
  emma: (s) => loadEmma(s),
  diane: (s) => loadDiane(s),
};
