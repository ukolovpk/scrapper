import Scrapper from "../src/scrapper";
import FilesHelper from "../src/filesHelper";


let urlsToVisit = ["https://www.yanao.ru/"];
let visitedUrls = [];


it("Запись в файл всех ссылок и ресурсов, приходящих извне, имеющих домен, отличный от посещаемого URL", () => {
    for (let i = 0; i < urlsToVisit.length; i++) {
        let url = urlsToVisit[i];
        let scrapper = new Scrapper(url);
        let filesHelper = new FilesHelper();
        let network = scrapper.getNetworkTraffic();
        scrapper.open();
        let hrefs = scrapper.getAllLinks();
        let otherDomainsHrefs = scrapper.getDomainsHrefs(hrefs, "other domains");
        let otherDomainsNetwork = scrapper.getOtherDomainsNetwork(network);
        let formattedStrings = filesHelper.formatToStrings(otherDomainsHrefs)
            .concat(filesHelper.formatToStrings(otherDomainsNetwork));
        filesHelper.writeToFile(formattedStrings, url);
        visitedUrls.push(url);
        let currentDomainsHrefs = scrapper.getDomainsHrefs(hrefs, "current domains");
        Object.keys(currentDomainsHrefs).forEach(url => {
            if (!urlsToVisit.includes(url) && !visitedUrls.includes(url)) {
                urlsToVisit.push(url);
            }
        });
        console.log(`Текущий URL: ${url}`);
        console.log(`Количество URL для посещения: ${urlsToVisit.length}`);
        console.log(`Колиество посещённых и проанализированных URL: ${visitedUrls.length}`);
    }
});