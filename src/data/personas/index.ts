import { loadMia } from "./mia";
import { loadPriya } from "./priya";
import { loadAisha } from "./aisha";
import { loadEmma } from "./emma";
import { loadDiane } from "./diane";

export { loadMia, loadPriya, loadAisha, loadEmma, loadDiane };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Loader = (store: any) => void;

/** Map from persona access code suffix to loader function */
export const PERSONA_LOADERS: Record<string, Loader> = {
  mia: (s) => loadMia(s),
  priya: (s) => loadPriya(s),
  aisha: (s) => loadAisha(s),
  emma: (s) => loadEmma(s),
  diane: (s) => loadDiane(s),
};
