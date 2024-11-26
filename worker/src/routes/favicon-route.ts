export default function (req: Request) {
  if (/favicon/.test(req.url)) {
    return new Response(null, { status: 204 });
  }
}
