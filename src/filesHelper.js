const fs = require('fs');
const parseDomain = require("parse-domain");

class FilesHelper {

    /** 
     * Преобразовывает принимаемый объект в массив отформатированных строк.
     * @param {object} Объект, который возвращают методы Scrapper.getOtherDomainsHrefs / getOtherDomainsNetwork
     * @returns {Array} Массив строк, каждая из которых имеет вид: Домен <TAB> Полный URL <TAB> Mime-type
     * Mime-type у html-ссылок – href.
    */
    formatToStrings(obj) {
        return Object.keys(obj).map(key => {
            return `${obj[key].domain}\t${key}\t${obj[key].type}`;
        });
    };

    /**
     * Записывает построчно строки из массива в файл. 
     * 1. Сначала создаётся директория (если её нет) с названием домена того урла,
     * который проверяем. Если директория есть, то файл записывается в неё.
     * 2. Если в урле есть какой-то путь (https://url.com/search/phones), 
     * то название файла – путь через пробел ("search phones.txt");
     * если урл такого вида – https://url.com/, то название файла – "url.txt".
     * @param {Array} lines Массив отформатированных строк.
     * @param {string} url Строка со значением URL, который проверяем.
     */
    writeToFile(lines, url) {
        const dirName = "./results/";
        if (!fs.existsSync(dirName)){
            fs.mkdirSync(dirName);
        }
        const fileName = `./${dirName}/${parseDomain(url).domain}.txt`;
        const file = fs.createWriteStream(fileName, {flags:'a'});
        file.on('error', function (err) { Console.log(err) });
        file.write("ЗНАЧЕНИЕ ПРОВЕРЯЕМОГО URL ЦЕЛИКОМ:\n");
        file.write(`${url}\n\n`);
        file.write("ДОМЕН\tURL ПОЛНОСТЬЮ\tТИП (href или mime-type)\n\n");
        lines.forEach(value => file.write(`${value}\n\n`));
        file.end();
    };

};

export default FilesHelper;