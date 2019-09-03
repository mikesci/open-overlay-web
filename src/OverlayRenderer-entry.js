import React from "react";
import ReactDOM from "react-dom";
import LayerRenderer from "../open-overlay/src/components/LayerRenderer.jsx";
import ExternalElementHelper from "./ExternalElementHelper.js";
import Elements from "./Elements.jsx";


window.OverlayRenderer = new class {

    _lastOptions;
    _appElement;
    _elementCache;

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

        ExternalElementHelper.LoadFromLayers(options.layers).then(elements => {
            console.log(elements);
            ReactDOM.render(<LayerRenderer layers={options.layers} elements={elements} />, this._appElement);
        })
    }
}