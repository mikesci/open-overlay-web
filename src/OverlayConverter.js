import overlayTemplate from "./templates/overlay-template.js";

export default class OverlayConverter {

    _baseUrl;

    exportOverlay = (baseUrl, overlay) => {
        let filename = this.makeFilename("overlay");
        let fileBody = overlayTemplate({ overlay, baseUrl });
        return this.saveFile(filename, "text/html", fileBody);
    }

    htmlToOverlay = (html) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, "text/html");
        // we need to pull the version and the overlay definition
        const overlayDefinitionObj = doc.querySelector("#overlay-definition");
        if (!overlayDefinitionObj) { throw "File did not contain an overlay definition."; }
        return JSON.parse(overlayDefinitionObj.innerHTML);
    }

    makeFilename = (name) => {
        return name.replace(/[^a-z0-9]/ig, "-") + ".html";
    }

    saveFile = (name, type, data) => {
        // stupid ie support
        if (data !== null && navigator.msSaveBlob)
            return navigator.msSaveBlob(new Blob([data], { type: type }), name);

        const a = document.createElement("a");
        a.style.display = "none";
        const url = window.URL.createObjectURL(new Blob([data], {type: type}));
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }
}