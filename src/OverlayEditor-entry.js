import React from "react";
import ReactDOM from "react-dom";
import OverlayEditor from "../open-overlay/src/OverlayEditor.jsx";
import ExternalElementHelper from "./ExternalElementHelper.js";
import LocalStorageDAL from "./LocalStorageDAL.js";
import Elements from "./Elements.jsx";
import ExternalActionHandler from "./ExternalActionHandler.jsx";
import GoogleFontSource from "./GoogleFontSource.js";

window.OverlayEditor = new class {

    ELEMENT_LOADING = {};

    _fontSources = [ new GoogleFontSource() ];
    _storage = new LocalStorageDAL();
    _appElement;
    _target;
    _options;
    _layers;
    _elementCache;
    _externalActionHandler;

    _loadElementsFromStorage() {
        return new Promise((resolve, reject) => {
            // load from storage
            let elements = [];
            let loadPromises = [];
            for(let externalElement of this._storage.ListExternalElements()) {
                let loadPromise = ExternalElementHelper.MakeComponent({
                    url: externalElement.url,
                    manifest: externalElement.manifest
                }).then(component => ({
                    elementName: externalElement.url,
                    component: component
                }))
                .catch(err => ({
                    elementName: externalElement.url,
                    component: ExternalElementHelper.CreateErrorElement(externalElement.url, err.toString())
                }));

                loadPromises.push(loadPromise);
            }

            Promise.all(loadPromises).then(loadedComponents => {
                for(let loadedComponent of loadedComponents) {
                    elements[loadedComponent.elementName] = loadedComponent.component;
                }
                resolve(elements);
            });
        });
    }

    onAddExternalElement = url => {
        return ExternalElementHelper.LoadFromUrl(url)
            .then(externalElement => ExternalElementHelper.MakeComponent(externalElement).then(component => ({ externalElement, component })))
            .then(result => {

                // everything went smoothly, add to local storage
                this._storage.AddExternalElement(result.externalElement);

                // update local element list
                this._elementCache[result.externalElement.url] = result.component;

                // re-render
                this.renderReactElement();
            });
    }

    onRemoveExternalElement = elementName => {
        // delete from storage
        this._storage.DeleteExternalElement(elementName);
         
        // delete from local list
        delete this._elementCache[elementName];

        // delete referencing layers
        let layers = [...this._layers];
        let referencingLayerIndex = layers.findIndex(r => r.elementName == elementName);
        while (referencingLayerIndex > -1) {
          layers.splice(referencingLayerIndex, 1);
          referencingLayerIndex = layers.findIndex(r => r.elementName == elementName);
        }

        this._layers = layers;

        console.log({ newLayers: this._layers });

        this.renderReactElement();
    }

    onLayersChanged = (layers, serializedLayers) => {
        this._layers = layers;
        if (this._options.onLayersChanged) {
            this._options.onLayersChanged(layers, serializedLayers);
        }
    }

    renderReactElement = () => {
        ReactDOM.render(<OverlayEditor
            width={1920}
            height={1080}
            layers={this._layers}
            elements={this._elementCache}
            fontSources={this._fontSources}
            onAddExternalElement={this.onAddExternalElement}
            onRemoveExternalElement={this.onRemoveExternalElement}
            onDataTransfer={this._externalActionHandler.HandleDataTransfer}
            onLayersChanged={this.onLayersChanged} />, this._appElement);
            
    }

    mount(options) {
        this._options = options;
        this._target = options.target || document.body;
        this._layers = options.layers || [];

        // inject a root element
        if (!this._appElement) {
            this._appElement = document.createElement("div");
            this._appElement.id = "app";
            this._appElement.className = "bp3-dark"; // dark mode
            this._target.appendChild(this._appElement);
        }

        this._externalActionHandler = new ExternalActionHandler({
            onUpload: options.onUpload
        });

        this._elementCache = Object.assign({}, Elements.Builtin);

        // render immediately with builtin elements only
        this.renderReactElement();
        
        // then load from local storage
        this._loadElementsFromStorage().then(elements => {
            this._elementCache = Object.assign(this._elementCache, elements);
            this.renderReactElement();
        });

        // and also from layers
        ExternalElementHelper.LoadFromLayers(this._layers).then(elements => {
            this._elementCache = Object.assign(this._elementCache, elements);
            this.renderReactElement();
        })
    }
}