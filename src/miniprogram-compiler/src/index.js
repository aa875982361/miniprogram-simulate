const path = require('path')
const glob = require('glob')
const unescapeJs = require('unescape-js')

const wcc = require('./wcc')
const wcsc = require('./wcsc')

module.exports = {
    wxmlToJs(rootPath, wxmlList, wxsList) {
    // wcc 编译器需要完整的 wxml 文件列表

        if (!Array.isArray(wxmlList)) {
            const files = glob.sync('**/*.wxml', {
                cwd: rootPath,
                nodir: true,
                dot: true,
                ignore: ['node_modules/**/*.wxml'],
            })
            wxmlList = files.map(file => file.substr(0, file.length - 5))
        } else {
            const reg = /\.wxml$/g
            wxmlList = wxmlList.map(wxmlPath => wxmlPath.replace(reg, ''))
        }
        if (!Array.isArray(wxsList)) {
            wxsList = glob.sync('**/*.wxs', {
                cwd: rootPath,
                nodir: true,
                dot: true,
                ignore: ['node_modules/**/*.wxs'],
            })
        }

        console.log('wxmlList', wxmlList)
        console.log('wxsList', wxsList)
        const compileResult = wcc(rootPath, wxmlList, wxsList)
        // console.log('compileResult', compileResult)

        return `
      ${compileResult};
      return $gwx;
    `
    },

    wxssToJs(rootPath) {
    // wcsc 编译器需要完整的 wxss 文件列表
        const files = glob.sync('**/*.wxss', {
            cwd: rootPath,
            nodir: true,
            dot: true,
            ignore: ['node_modules/**/*.wxss'],
        })
        const compileResult = wcsc(rootPath, files.map(file => file.substr(0, file.length - 5)))

        // 拼装 wxss map 字符串
        let wxssMap = ''
        Object.keys(compileResult).forEach(key => {
            if (path.extname(key) === '.wxss') {
                wxssMap += `'${key}': ${unescapeJs(compileResult[key])},`
            }
        })

        return `
      ${unescapeJs(compileResult.comm)};
      var wxssMap = { ${wxssMap} };
      return function (filePath) {
        return wxssMap[filePath];
      };
    `
    },
}
