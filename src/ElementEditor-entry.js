import ElementEditor from "../open-overlay/src/ElementEditor.jsx";
import ExternalElementHelper from "../open-overlay/src/shared/ExternalElementHelper.js";

window.ElementEditor = new class {

    _stageRoot = null;

    mount(options) {
        // options.manifest
        // options.configValues

        let configValues = options.configValues || {};

        // build an element from the manifest
        let element = ExternalElementHelper.MakeComponent({
            url: window.location.href,
            manifest: options.manifest
        });

        // reroot the document body contents to a new container
        if (!this._stageRoot) {
            let stageRoot = document.createElement("div");
            this._stageRoot = stageRoot;

            // DOM based elements
            while(document.body.children.length > 0) { stageRoot.append(document.body.firstChild); }
        }

        // inject a root element
        let appElement = document.createElement("div");
        appElement.id = "app";
        appElement.className = "bp3-dark"; // dark mode
        document.body.appendChild(appElement);

        ReactDOM.render(<ElementEditor
            stageRoot={this._stageRoot}
            element={element}
            configValues={options.configValues}
            onConfigValuesChanged={options.onConfigValuesChanged}
            onConfigure={options.onConfigure} />, appElement);    

    }
}