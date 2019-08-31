import FontLoader from "../open-overlay/src/shared/FontLoader.js";

window.OpenOverlay = new class OpenOverlay {

    ParseHash = () => {
        if (window.location.hash.length > 1) {
            try {
                return JSON.parse(decodeURIComponent(window.location.hash.substr(1)));
            } catch(err) {
                console.log("Could not parse hash: " + err);
                return null;
            }
        }
        return null;
    }

    Autobind = (configValues, parameters) => {
        if (!configValues) { return; }
        for(let parameter of parameters) {
            let parameterValue = configValues[parameter.name];

            // skip anything that doesn't have a value
            if (parameterValue == undefined) { continue; }

            switch (parameter.type) {
                case "font":
                case "style":
                    document.querySelectorAll(parameter.autobind).forEach(element => {
                        for(let [key, value] of Object.entries(parameterValue)) {
                            element.style[key] = value;
                        }
                    });
                    break;
                default:
                    document.querySelectorAll(parameter.autobind).forEach(element => element.innerHTML = parameterValue);
                    break;
            }
        }
    }

    HTMLElement = options => {

        // if this window has a parent, emit the manifest as a message
        if (window.parent)
            window.parent.postMessage({ "manifest": options.manifest }, "*");
        
        let autoBoundParameters;
        let fontParameters;
        if (options.manifest && options.manifest.parameters) {
            autoBoundParameters = options.manifest.parameters.filter(p => p.autobind);
            fontParameters = options.manifest.parameters.filter(p => p.type == "font");
        }

        function updateConfiguration() {
            let configValues = window.OpenOverlay.ParseHash();

            let fontPromises = [];
            if (fontParameters) {
                for(let parameter of fontParameters) {
                    let font = configValues[parameter.name];
                    if (font && font.fontFamily) {
                        let fontPromise = FontLoader.EnsureFont(font.fontFamily);
                        if (fontPromise) { fontPromises.push(fontPromise); }
                    }
                }
            }
            if (fontPromises.length > 0) {
                // hide the body until all of the fonts have been loaded
                document.body.style["visiblity"] = "hidden";
                // and unhide when loaded
                Promise.all(fontPromises).then(() => { document.body.style["visibility"] = ""; });
            }

            if (autoBoundParameters)
                window.OpenOverlay.Autobind(configValues, autoBoundParameters);
            if (options.onConfigure) 
                options.onConfigure(configValues, options.manifest.parameters);
        }

        // monitor for hash changes
        window.addEventListener("hashchange", updateConfiguration);
        window.addEventListener("load", updateConfiguration);
    }

}