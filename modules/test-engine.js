import fs from 'fs'
import MenuManager from './menu-manager.js'
import SendMail from './send-mail.js'

/*

!!!  WARNING:              !!!
!!!  OLD SHIT PORTED CODE  !!!
!!!   (read at own risk)   !!!

*/

export default class TestEngine {
    constructor(webserver, pagerenderer, emailCfg) {
        this.webserver = webserver
        this.pagerenderer = pagerenderer
        this.emailCfg = emailCfg
        
        this.menu = new MenuManager('./resources/menu.json')

        this.webserver.html('/tests', async (req, res) => { //Меню с тестами
            return this.pagerenderer.render('main', {content: {cont: (await this.pagerenderer.render('testlist', {tests: this.getTestList()})), title: "Тесты"}, menu: this.menu.get(), addr: req.path});
        })
        
        this.webserver.html(/\/tests\/.+/, async (req, res) => { //Конкретный тест
                let path = req.path.replace('/tests/', '');
                if (!this.testExists(path)) return 404
                return this.pagerenderer.render('main', {content: await this.loadTest(this.getTestList()[path].test), menu: this.menu.get(), addr: req.path});
        })
        this.initValidator()
    }

    initValidator() {
        const handler = async (req, res) => {  //logic for validating tests and sending results
            var data = req.body
            var test = this.getTestList()[data.testname.replace('/tests/', '')].test
            var isEmail = !!data.email
           
            var outobj = {
                error: '',
                questions: {},
                result: {
                    r: 0,
                    o: 0
                }
            }
            if (isEmail) {
                outobj.testname = data.testname
                var emailAnswers = {}
            }
            for (let ans in data) {
                outobj.result.o++
                if (data[ans].startsWith('test_o:')) {
                    data[ans] = data[ans].replace('test_o:', '')
                    if (isEmail) {
                        emailAnswers[ans] = {
                            answer: test.questions[ans].opts[data[ans]],
                            right: test.questions[ans].opts[test.questions[ans].right]
                        }
                    }
                    if (test.questions[ans].right == data[ans]) {
                        outobj.questions[ans] = true
                        outobj.result.r++
                    } else {
                        outobj.questions[ans] = false
                    }
                } else if (data[ans].startsWith('test_m:')) {
                    data[ans] = data[ans].replace('test_m:', '').split(',')
                    if (isEmail) {
                        emailAnswers[ans] = {
                            answer: [],
                            right: []
                        }
                        for (rig in test.questions[ans].right) {
                            emailAnswers[ans].right.push(test.questions[ans].opts[rig])
                        }
                        emailAnswers[ans].right = emailAnswers[ans].right.join(', ')
                    }
                    var isStillRight = true
                    for (let variant of data[ans]) {
                        if (isEmail) emailAnswers[ans].answer.push(test.questions[ans].opts[variant])
                        if (isStillRight && variant in test.questions[ans].right) {
                            isStillRight = true
                        } else {
                            isStillRight = false
                        }
                    }
                    if (isEmail) emailAnswers[ans].answer = emailAnswers[ans].answer.join(', ')
                    outobj.questions[ans] = isStillRight
                    if (isStillRight) outobj.result.r++
                } else if (data[ans].startsWith('text:')) {
                    data[ans] = data[ans].replace('text:', '')
                    if (isEmail) {
                        emailAnswers[ans] = {
                            answer: data[ans],
                            right: test.questions[ans].right
                        }
                    }
                    if (this.stringComparator(test.questions[ans].right, data[ans])) {
                        outobj.questions[ans] = true
                        outobj.result.r++
                    } else {
                        outobj.questions[ans] = false
                    }
                } else {
                    outobj.result.o--
                    if (ans != 'testname' && ans != 'email')
                    outobj.error = 'Invalid type of answer!'
                    
                }
            }
            
        
            if (isEmail) {
                data.email = JSON.parse(data.email)
                for (ans in outobj.questions) {
                    outobj.questions[ans] = {
                        num: ans - 1 + 2,
                        question: test.questions[ans].title,
                        right: emailAnswers[ans].right,
                        answer: emailAnswers[ans].answer,
                        isRight: outobj.questions[ans],
                    }
                }
                outobj.email = {
                    name: data.email.name,
                    group: data.email.group,
                }
                outobj.testtitle = test.name
                console.log(outobj)
                let htmlEmail = await this.pagerenderer.render('email', {data: outobj})
                await SendMail({
                    ...this.emailCfg,
                    recipient: data.email.email,
                    subject: `Ответы на тест ${outobj.testtitle} - ${outobj.email.name} (${outobj.email.group})`
                }, htmlEmail)
            }
            res.json(outobj)
        }
        this.webserver.app.post('/validatetest', async (req, res) => {
            try {
                await handler(req, res)
            } catch (e) {
                console.error(e)
                req.sendStatus(500)
            }

        })
    }
    getTestList() {
        var list = fs.readdirSync('./tests/');
        var obj = {};
        for (var a of list) {
            obj[a.replace('.json', '')] = JSON.parse(fs.readFileSync('./tests/' + a, 'utf-8'));
        }
        console.log(obj)
        return obj;
    }
    
    testExists(path) {
        return fs.existsSync('./tests/' + path + '.json');
    }
    
    async loadTest(testbody) {
        return {cont: (await this.pagerenderer.render('test', {test: testbody})), title: testbody.name + " (Тест)"}
    }

    stringComparator(str1, str2) {
        let unify = s => s.toString()
            .replaceAll('.', ',') //do some string magic
            .replaceAll(' ', '')
            .toLowerCase()
            .trim()

        return unify(str1) == unify(str2)
    }
}