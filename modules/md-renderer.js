import markdownIt from 'markdown-it'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItTitle from 'markdown-it-title'

export default class MarkdownRenderer {
    constructor(additionalMiddleware = []) {
        this.mdto = markdownIt({ typographer: true })
            .use(markdownItSub)
            .use(markdownItSup)
            .use(markdownItTitle)
        for (let mw of additionalMiddleware) {
            this.mdto = this.mdto.use(mw)
        }
    }

    render(content, title) {
        return this.mdto.render(content, title)
    }
}
