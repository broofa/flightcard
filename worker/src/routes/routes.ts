import corsPreflightRoute from './cors-route';
import faviconRoute from './favicon-route';
import idSearchRoute from './id-search-route';
import membersMetaRoute from './members-meta-route';
import membersUploadRoute from './members-upload-route';
import nameSearchRoute from './name-search-route';

type Route = (req: Request, env: Env) => Promise<unknown> | unknown;

// Ad-hoc router structure.  Every request is passed through these function in
// order, until one of them returns a Response or object.
export const ROUTES: Route[] = [
  faviconRoute,
  corsPreflightRoute,
  membersUploadRoute,
  membersMetaRoute,
  nameSearchRoute,
  idSearchRoute,
];
