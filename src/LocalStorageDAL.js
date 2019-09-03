export default class LocalStorageDAL {
    
    ListExternalElements() {
        return JSON.parse(window.localStorage.getItem("externalElements")) || [];
    }

    AddExternalElement(externalElement) {
        let list = JSON.parse(window.localStorage.getItem("externalElements")) || [];
        list.push(externalElement);
        window.localStorage.setItem("externalElements", JSON.stringify(list));
    }

    DeleteExternalElement(url) {
        let list = JSON.parse(window.localStorage.getItem("externalElements")) || [];
        
        let index = list.findIndex(r => r.url == url);
        if (index > -1) {
            list.splice(index, 1);
            window.localStorage.setItem("externalElements", JSON.stringify(list));
        }
    }

}