import polka from 'polka'
import serveStatic from 'serve-static'
import path from 'path'

const PORT = process.env.PORT || 9007
const PWD = process.env.PWD

const app = polka()
app
  .use(serveStatic(path.resolve(PWD, 'app')))
  .listen(PORT, _ => {
    console.log(`> Running on http://localhost:${PORT}`)
  })
