const parseDomain = require("parse-domain");
const punycode = require('punycode');

class Scrapper {

    /**
     * Создает экземпляр Scrapper.
     *
     * @constructor
     * @this  {Scrapper}
     * @param {string} url Проверяемый URL.
    */
    constructor(url) {
        this.url = url;
    };

    /**
     * Открывает нужный URL и ждёт 5 секунд. Перезаписывает this.url на случай редиректа, извлекаем домен.
    */
    open() {
        browser.url(this.url);
        browser.pause(5000);
        this.url = browser.getUrl();
        if (parseDomain(this.url) === null) {
            try {
                let url = this.punycodeToUnicode(this.url);
                let parsedUrl = parseDomain(url);
                this.domain = `${parsedUrl.domain}.${parsedUrl.tld}`;
            } catch {
                throw new Error("Домен не найден");
            };
        } else {
            let parsedUrl = parseDomain(this.url);
            this.domain = `${parsedUrl.domain}.${parsedUrl.tld}`;
        };
    };

    /** 
     * Ищет все элементы с тэгом "a" в html-коде страницы 
     * и создаёт список из значений атрибута "href"
     * @returns {Array} Массив строк (атрибуты "href")
    */
    getAllLinks() {
        const isUrl = require("is-url");
        const allElems = $$("//a");
        let hrefs = [];
        allElems.forEach(element => {
            let href = element.getAttribute("href");
            if (isUrl(href) === true) {
                hrefs.push(href);
            } //else { console.log(`Значение "${href}" не является ссылкой`) }
        });
        return hrefs;
    };

    /**
     * Включает слежение за сетевой активностью в браузере (вкладка "Network"). 
     * @returns {Array} Массив объектов, которые содержат в себе информацию о запросах
    */
    getNetworkTraffic() {
        browser.cdp("Network", "enable");
        let parameters = [];
        browser.on("Network.responseReceived", (params) => {
            parameters.push(params.response);
        });
        return parameters;
    };

    /**
     * Приводит урл, содержащий пуникод, к юникоду. Если не получается – возвращаем исключение
     * @param {string} url 
     */
    punycodeToUnicode(url) {
        let replacedUrl = url.split(/(^\w+:|^)\/\//);
        let result = replacedUrl[2].split("/");
        if (result[1].trim() === "") {
            result = punycode.toUnicode(result.join(""));
        } else {
            result = `${punycode.toUnicode(result[0])}/${result.slice(1).join("/")}`; 
        }
        if (result === null || result === "") {
            throw new Error("Не удалось конвертировать URL!");
        }
        return `${replacedUrl[1]}//${result}`;
    };

    /**
     * Парсит урл и возвращает домен и зону, а также полный урл.
     * Если распарсить не получается (например, если формат урла – пуникод),
     * то пытаемся преобразовать из пуникода.
     * @param {string} url 
     * @returns {object} Объект, который хранит в себе домен и полный урл.
     */
    getDomain(url) {
        let domain;
        if (parseDomain(url) === null) {
            try {
                url = this.punycodeToUnicode(url);
                let parsedUrl = parseDomain(url);
                domain = `${parsedUrl.domain}.${parsedUrl.tld}`;
            } catch {
                domain = "Домен не найден";
            };
        } else {
            let parsedUrl = parseDomain(url);
            domain = `${parsedUrl.domain}.${parsedUrl.tld}`;
        };
        return { domain: domain, url: url };
    };

    /**
     * Работает с массивом строк-атрибутов "href": 
     * ищет те URL, домен которых отличается от домена URL, который открыт.
     * @param {Array} hrefs Массив из значений атрибутов href ссылок на странице.
     * @param {string} mode Принимает значения "other domains" и "current domains" в зависимости от того, какие ссылки мы хотим получить.
     * @returns {object} Объект вида: полный_урл1: {domain: domain, type: type}, ..., полныйУрл2: ...
    */
    getDomainsHrefs(hrefs, mode) {
        let differentDomainsHrefs = {};
        hrefs.forEach(href => {
            let domain = this.getDomain(href);
            if (mode === "other domains") {
                if (domain.domain !== this.domain) {
                    differentDomainsHrefs[domain.url] = {
                        domain: domain.domain,
                        type: "href",
                    };
                };
            } else if (mode === "current domains") {
                if (domain.domain === this.domain) {
                    differentDomainsHrefs[domain.url] = {
                        domain: domain.domain,
                        type: "href",
                    };
                };
            }
            
        });
        return differentDomainsHrefs;
    };

    /**
     * Ищет те URL из вкладки Network, домен которых отличается от домена URL, который открыт.
     * @param {object} network Массив объектов, которые содержат в себе информацию о запросах
     * @returns {object} Объект вида: полный_урл1: {domain: domain, type: type}, ..., полныйУрл2: ...
    */
    getOtherDomainsNetwork(network) {
        let differentDomainsNetwork = {};
        network.forEach(query => {
            let domain = this.getDomain(query.url);
            if (domain.domain !== this.domain) {
                differentDomainsNetwork[domain.url] = {
                    domain: domain.domain,
                    type: query.mimeType,
                };
            }
        });
        return differentDomainsNetwork;
    };

};

export default Scrapper;