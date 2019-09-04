import React from "react";
import ReactDOM from "react-dom";
import ExternalElementHelper from "./ExternalElementHelper.js";
import GoogleFontSource from "./GoogleFontSource.js";
import LayerRenderer from "../open-overlay/src/components/LayerRenderer.jsx";
import FontLoader from "../open-overlay/src/shared/FontLoader.js";
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

        let fontLoader = new FontLoader([ new GoogleFontSource() ]);

        ExternalElementHelper.LoadFromLayers(options.layers).then(loadedElements => {
            let elements = Object.assign(Elements.Builtin, loadedElements);
            ReactDOM.render(<LayerRenderer layers={options.layers} elements={elements} fontLoader={fontLoader} />, this._appElement);
        })
    }
}