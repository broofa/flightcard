export default function (request: Request) {
  if (/favicon/.test(request.url)) {
    return new Response(null, { status: 204 });
  }
}
