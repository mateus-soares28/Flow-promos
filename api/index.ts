import { appPromise } from "../server/_core/index";

export default async function handler(request: any, response: any) {
  const app = await appPromise;
  return app(request, response);
}
