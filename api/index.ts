export default async function handler(request: any, response: any) {
  const { appPromise } = await import("../server/_core/index");
  const app = await appPromise;
  return app(request, response);
}
