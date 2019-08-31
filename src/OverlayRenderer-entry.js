import React from "react";
import ReactDOM from "react-dom";
import LayerRenderer from "../open-overlay/src/components/LayerRenderer.jsx";
import ExternalElementHelper from "../open-overlay/src/shared/ExternalElementHelper.js";
import Elements from "./Elements.jsx";


window.OverlayRenderer = new class {

    _lastOptions;
    _appElement;
    _elementCache;

    _loadElements(layers) {
        return new Promise((resolve, reject) => {
            if (this._elementCache) {
                resolve(this._elementCache);
                return;
            }

            this._elementCache = Object.assign({}, Elements.Builtin);

            let loadPromises = [];
            for(let layer of layers) {
                if (layer.elementName && layer.elementName.startsWith("http") && !this._elementCache[layer.elementName]) {

                    let loadPromise = ExternalElementHelper.MakeComponent({
                        url: layer.elementName,
                        manifest: {}
                    }).then(component => ({
                        elementName: layer.elementName,
                        component: component
                    }))
                    .catch(err => {
                        console.log(err);
                    });

                    loadPromises.push(loadPromise);
                }
            }    

            Promise.all(loadPromises).then(loadedComponents => {

                for(let loadedComponent of loadedComponents) {
                    this._elementCache[loadedComponent.elementName] = loadedComponent.component;
                }

                resolve(this._elementCache);
            });
        });
    }

    mount(options) {

        // save options to _lastOptions to allow for mount() to be called later without a parameter
        if (!options) {
            if (!this._lastOptions) {
                console.log("No options provided.");
                return;
            }
            options = this._lastOptions;
        } else {
            this._lastOptions = options;
        }

        // inject a root element
        if (!this._appElement) {

            options.target["style"] 

            this._appElement = document.createElement("div");
            this._appElement.id = "app";
            options.target.appendChild(this._appElement);
        }

        this._loadElements(options.layers).then(elements => {
            console.log(elements);
            ReactDOM.render(<LayerRenderer layers={options.layers} elements={elements} />, this._appElement);
        })
    }
}