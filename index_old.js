var Datastore = require('nedb');
var db = new Datastore({ filename: 'database.db', autoload: true });
var sendMail = require('./modules/email')





const fs = require('fs');

let ejs = require('ejs');

var mdto = require('markdown-it')({ typographer: true })
  .use(require('markdown-it-sub'))
  .use(require('markdown-it-sup'))
  .use(require('markdown-it-title'))
const express = require('express');
const e = require('express');
const app = express();
const port = 3000;
var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));

var loadArticle = function(article) {
  var title = {};
  var content = mdto.render(fs.readFileSync(__dirname + '/articles/' + article + '.md', 'utf-8'), title);
  content = {cont: content, title: title.title}
  return content;
}
var articleExists = function(article) {
  return fs.existsSync(__dirname + '/articles/' + article + '.md')
}

var getMenu = function() {
  return JSON.parse(fs.readFileSync(__dirname + '/resources/menu.json', 'utf-8'))
}

var getTestList = function() {
  var list = fs.readdirSync('./tests/');
  var obj = {};
  for (var a of list) {
    obj[a.slice(0, -5)] = JSON.parse(fs.readFileSync('./tests/' + a, 'utf-8'));
  }
  console.log(obj)
  return obj;
}

var testExists = function(path) {
  return fs.existsSync('./tests/' + path + '.json');
}

var loadTest = async function(testbody) {
  return {cont: (await ejs.renderFile('./views/test.ejs', {test: testbody})), title: testbody.name + " (Тест)"}
}

app.use(express.static('resources'));
app.set('view engine', 'ejs');


app.get('/', (req, res) => {
  res.render('main', {content: loadArticle('home'), menu: getMenu(), addr: req.path});
})


app.get('/tests', async (req, res) => { //Меню с тестами
  res.render('main', {content: {cont: (await ejs.renderFile('./views/testlist.ejs', {tests: getTestList()})), title: "Тесты"}, menu: getMenu(), addr: req.path});
})

app.get(/\/tests\/.+/, async (req, res) => { //Конкретный тест
    let path = req.path.replace('/tests/', '');
    if (testExists(path)) {
      res.render('main', {content: await loadTest(getTestList()[path].test), menu: getMenu(), addr: req.path});
    } else {
      res.render('main', {content: loadArticle('404'), menu: getMenu(), addr: req.path});
    }
    
})

app.get(/\/a\/.*/, (req, res) => {
    let path = req.path.replace('/a/', '');
    let article = '404';
    if (articleExists(path)) {
      article = path;
    }
    res.render('main', {content: loadArticle(article), menu: getMenu(), addr: req.path});
})


var stringComparator = function(str1, str2) {
  str1 = str1.toString()
    .replace('.', ',') //do some string magic
    .replace(' ', '')
    .toLowerCase();
  str2 = str2.toString()
    .replace('.', ',') //once more 
    .replace(' ', '')
    .toLowerCase();

  return str1 == str2;
}


app.post('/validatetest', async (req, res) => {  //logic for validating tests and sending results
  var data = req.body;
  console.log(data)
  var test = getTestList()[data.testname.replace('/tests/', '')].test;
  var isEmail = false;
  if (data.email) {
    isEmail = true;
  } 
  console.log(test)
  var outobj = {
    error: '',
    questions: {},
    result: {
      r: 0,
      o: 0
    }
  };
  if (isEmail) {
    outobj.testname = data.testname;
    var emailAnswers = {};
  } 
  for (let ans in data) {
    console.log(ans)
    console.log(data[ans])
    outobj.result.o++;
    if (data[ans].startsWith('test_o:')) {
      data[ans] = data[ans].replace('test_o:', '');
      if (isEmail) {
        emailAnswers[ans] = {
          answer: test.questions[ans].opts[data[ans]],
          right: test.questions[ans].opts[test.questions[ans].right]
        };
      }
      if (test.questions[ans].right == data[ans]) {
        outobj.questions[ans] = true;
        outobj.result.r++;
      } else {
        outobj.questions[ans] = false;
      }
    } else if (data[ans].startsWith('test_m:')) {
      data[ans] = data[ans].replace('test_m:', '').split(',');
      if (isEmail) {
        emailAnswers[ans] = {
          answer: [],
          right: []
        };
        for (rig in test.questions[ans].right) {
          emailAnswers[ans].right.push(test.questions[ans].opts[rig]);
        }
        emailAnswers[ans].right = emailAnswers[ans].right.join(', ');
      }
      var isStillRight = true;
      for (let variant of data[ans]) {
        if (isEmail) emailAnswers[ans].answer.push(test.questions[ans].opts[variant]);
        if (isStillRight && variant in test.questions[ans].right) {
          isStillRight = true;
        } else {
          isStillRight = false;
        }
      }
      if (isEmail) emailAnswers[ans].answer = emailAnswers[ans].answer.join(', ');
      outobj.questions[ans] = isStillRight;
      if (isStillRight) outobj.result.r++;
    } else if (data[ans].startsWith('text:')) {
      data[ans] = data[ans].replace('text:', '')
      if (isEmail) {
        emailAnswers[ans] = {
          answer: data[ans],
          right: test.questions[ans].right
        };
      }
      if (stringComparator(test.questions[ans].right, data[ans])) {
        outobj.questions[ans] = true;
        outobj.result.r++;
      } else {
        outobj.questions[ans] = false;
      }
    } else {
      outobj.result.o--;
      if (ans != 'testname' && ans != 'email')
      outobj.error = 'Invalid type of answer!';
      
    }
  }
  

  if (isEmail) {
    data.email = JSON.parse(data.email);
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
    outobj.testtitle = test.name;
    console.log(outobj);
    let htmlEmail = await ejs.renderFile('./views/email.ejs', {data: outobj});
    await sendMail(data.email.email, `Ответы на тест ${outobj.testtitle} - ${outobj.email.name} (${outobj.email.group})`, htmlEmail);
  }
  console.log(outobj);
  res.json(outobj);
})

// 404
app.use(function(req, res, next) {
  res.status(404).render('main', {content: loadArticle('404'), menu: getMenu(), addr: req.path});
});



app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
})

