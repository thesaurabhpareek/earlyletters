/** Browsers and link previewers ask for /favicon.ico by habit; answer with a permanent redirect to the SVG icon. */
export function GET(request: Request): Response {
  return Response.redirect(new URL('/icon.svg', request.url), 308);
}
