import { appPromise } from "../dist/server/index.js";

export default async function handler(request: any, response: any) {
  const app = await appPromise;
  return app(request, response);
}
