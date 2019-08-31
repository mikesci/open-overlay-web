import React from "react";
import ReactDOM from "react-dom";
import OverlayEditor from "../open-overlay/src/OverlayEditor.jsx";
import ExternalElementHelper from "../open-overlay/src/shared/ExternalElementHelper.js";

import Elements from "./Elements.jsx";
import ExternalActionHandler from "./ExternalActionHandler.jsx";

window.OverlayEditor = new class {

    ELEMENT_LOADING = {};

    _elementCache;

    _loadElements(storage, layers) {

        if (this._elementCache) {
            return new Promise((resolve) => resolve(this._elementCache));
        }
        
        this._elementCache = Object.assign({}, Elements.Builtin);

        let loadPromises = [];

        // load from storage
        let externalElements = storage.ListExternalElements();
        for(let externalElement of externalElements) {
            this._elementCache[externalElement.url] = this.ELEMENT_LOADING;

            let loadPromise = ExternalElementHelper.MakeComponent({
                url: externalElement.url,
                manifest: externalElement.manifest
            }).then(component => ({
                elementName: externalElement.url,
                component: component
            }))
            .catch(err => {
                console.log(err);
                return null;
            });

            loadPromises.push(loadPromise);
        }

        // load from layers
        for(let layer of layers) {
            if (layer.elementName && layer.elementName.startsWith("http") && !this._elementCache[layer.elementName]) {

                this._elementCache[layer.elementName] = this.ELEMENT_LOADING;

                let loadPromise = ExternalElementHelper.MakeComponent({
                    url: layer.elementName,
                    manifest: {}
                }).then(component => ({
                    elementName: layer.elementName,
                    component: component
                }))
                .catch(err => {
                    console.log(err);
                    return null;
                });

                loadPromises.push(loadPromise);
            }
        }

        return Promise.all(loadPromises).then(loadedComponents => {
            
            for(let loadedComponent of loadedComponents) {
                if (loadedComponent) {
                    this._elementCache[loadedComponent.elementName] = loadedComponent.component;
                }
            }

            return this._elementCache;
        });
    }

    mount(options) {

        let target = options.target || document.body;
        let layers = options.layers || [];

        // inject a root element
        let appElement = document.createElement("div");
        appElement.id = "app";
        appElement.className = "bp3-dark"; // dark mode
        target.appendChild(appElement);

        let externalActionHandler = new ExternalActionHandler({
            onUpload: options.onUpload
        });

        this._loadElements(options.storage, layers).then(elements => {
            ReactDOM.render(<OverlayEditor
                width={1920}
                height={1080}
                layers={layers}
                elements={elements}
                storage={options.storage}
                onDataTransfer={externalActionHandler.HandleDataTransfer}
                onLayersChanged={options.onLayersChanged} />, appElement);
        });
    }
}