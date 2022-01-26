export default class Serve404 {
    constructor(webserver, articleserver, article = '404') {
        webserver.app.get('*', function(req, res){
            articleserver.renderArticle(article).then(a => res.status(404).send(a))
        })
    }
}