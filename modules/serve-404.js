export default class Serve404 {
    constructor(webserver, articleserver, article = '404') {
        let rnd404 = async function(code) {
            if (code == 404) return await articleserver.renderArticle(article)
            return code + " Error"
        }
        webserver.set404renderer(rnd404)
        webserver.webserver.app.get('*', async function(req, res){
            return res.send(Buffer.from(await rnd404(404)))
        })
    }
}