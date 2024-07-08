// See https://github.com/parcel-bundler/parcel/issues/6220#issuecomment-885837128
export default function(app) {
  app.use((req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none')
    next()
  })
}
