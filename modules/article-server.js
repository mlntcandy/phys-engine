import MenuManager from "./menu-manager.js"
import MarkdownRenderer from "./md-renderer.js"
import fs from "fs"

export default class ArticleServer {
    constructor(path, webPath, pageRenderer, webserver) {
        this.path = path
        this.menu = new MenuManager('./resources/menu.json')
        this.mdrend = new MarkdownRenderer()
        this.pagerend = pageRenderer
        this.mainview = 'main'
        webserver.html(new RegExp('/' + webPath + '/.*'), (req) => {
            let path = req.path.replace('/' + webPath + '/', '')
            if (!this.articleExists(path)) return 404
            return this.pagerend.render(
                this.mainview, 
                {content: this.loadArticle(path), menu: this.menu.get(), addr: req.path}
            )
        })
    }

    serveHomePage(article, webserver) {
        webserver.html('/', (req) => this.pagerend.render(
            this.mainview, 
            {content: this.loadArticle(article), menu: this.menu.get(), addr: req.path}
        ))
    }

    loadArticle(article) {
        var title = {}
        var content = this.mdrend.render(fs.readFileSync(this.path + article + '.md', 'utf-8'), title)
        content = {cont: content, title: title.title}
        return content
    }
    articleExists(article) {
        return fs.existsSync(this.path + article + '.md')
    }
}