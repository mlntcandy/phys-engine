import markdownIt from 'markdown-it'
import markdownItSub from 'markdown-it-sub'
import markdownItSup from 'markdown-it-sup'
import markdownItTitle from 'markdown-it-title'

export default class MarkdownRenderer {
    constructor() {
        this.mdto = markdownIt({ typographer: true })
            .use(markdownItSub)
            .use(markdownItSup)
            .use(markdownItTitle)
    }

    render(content, title) {
        return this.mdto.render(content, title)
    }
}
