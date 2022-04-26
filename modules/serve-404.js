export default class Serve404 {
    constructor(webserver, articleserver, article = '404') {
        let rnd404 = function(req, res){
            articleserver.renderArticle(article).then(a => res.status(404).send(a))
        }
        webserver.app.get('*', rnd404)
        webserver.app.get('*/*', rnd404)
        webserver.app.get('*/*/*', rnd404)
    }
}