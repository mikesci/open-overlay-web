import { lazy, Suspense, useCallback, useRef, useState } from "react";
import OverlayConverter from "./OverlayConverter.js";

const OVERLAY_CONVERTER = new OverlayConverter();

function pickFile() {
    return new Promise((resolve, reject) => {
        const fileElement = document.createElement("input");
        fileElement.style = "display: none";
        fileElement.type = "file";
        fileElement.accept = "text/html";
        fileElement.addEventListener("change", () => {
            document.body.removeChild(fileElement);
            if (fileElement.files.length > 0)
                resolve(fileElement.files[0]);
            else
                reject();
        });
        document.body.appendChild(fileElement);
        fileElement.click();
    });
}

function readFile(file, onProgress, asText) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.addEventListener("load", () => resolve(reader.result));
        reader.addEventListener("progress", (evt) => onProgress(file, evt.loaded));
        reader.addEventListener("error", reject);
        if (asText)
            reader.readAsText(file);
        else
            reader.readAsDataURL(file);
    });
}

const OverlayEditor = lazy(() => import("./OverlayEditor.js"));

const Application = (props) => {
    const [initialOverlay, setInitialOverlay] = useState({ });
    const workingOverlayRef = useRef(initialOverlay);

    const onUploadAsset = useCallback(async (file, onProgress) => {
        // string lengths max out in most browsers at ~128MB, so we'll error if the file is larger
        if (file.size > 134217728)
            throw "File sizes greater than 128MB are not supported.";

        // if we're uploading an html file, read the whole thing in, and look to see if it's an overlay
        if (file.type == "text/html") {
            //console.log("yo", { file, size: file.size });
            // read in as text
            const result = await readFile(file, onProgress, true);
            // try to convert to an overlay.  if this fails, then it's not an overlay and we should return a dataUri
            try
            {
                const overlay = OVERLAY_CONVERTER.htmlToOverlay(result);
                setTimeout(() => {
                    setInitialOverlay(overlay);
                }, 50);
                return null;
            }
            catch
            {
                return "data:text/html;base64," + btoa(result);
            }
        }
        // otherwise, read as base64
        return await readFile(file, onProgress, false);
    }, []);
    

    const handleUpload = useCallback(async (file) => {
        if (file.type != "text/html") {
            alert("Unsupported file type.");
            return;
        }

        const data = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });

        try {
            const overlay = OVERLAY_CONVERTER.htmlToOverlay(data);
            workingOverlayRef.current = overlay;
            setInitialOverlay(overlay);
        } catch (ex) {
            alert("Could not parse file:" + ex);
        }
    }, []);

    const onUploadClick = useCallback(evt => {
        pickFile().then(handleUpload);
    }, []);

    const onOverlayChanged = useCallback(overlay => {
        workingOverlayRef.current = overlay;
    }, []);

    const onExport = useCallback(() => {
        OVERLAY_CONVERTER.exportOverlay(window.location.href, workingOverlayRef.current);
    }, []);

    const loadingFallback = (
        <div className="loading">
            <div className="inset">
                Loading Editor...
                <div className="bp3-progress-bar bp3-intent-primary">
                    <div className="bp3-progress-meter" style={{ "width": "100%" }}></div>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <div className="top-bar">
                <div className="left">
                    <a href="https://openoverlay.org/releases/2.0/" id="logo">
                        Open Overlay
                        <div className="bp3-tag bp3-minimal">2.0</div>
                    </a>
                    <div className="import-export bp3-button-group">
                        <button className="bp3-button bp3-small" onClick={onUploadClick}>
                            <span icon="import" className="bp3-icon bp3-icon-import"><svg data-icon="import" width="16" height="16" viewBox="0 0 16 16"><desc>import</desc><path d="M7.29 11.71c.18.18.43.29.71.29s.53-.11.71-.29l4-4a1.003 1.003 0 00-1.42-1.42L9 8.59V1c0-.55-.45-1-1-1S7 .45 7 1v7.59l-2.29-2.3a1.003 1.003 0 00-1.42 1.42l4 4zM15 11c-.55 0-1 .45-1 1v2H2v-2c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1z" fillRule="evenodd"></path></svg></span>
                            <div className="bp3-button-text">Import</div>
                        </button>
                        <button className="bp3-button bp3-intent-primary bp3-small" onClick={onExport}>
                            <span icon="export" className="bp3-icon bp3-icon-export"><svg data-icon="export" width="16" height="16" viewBox="0 0 16 16"><desc>export</desc><path d="M4 6c.28 0 .53-.11.71-.29L7 3.41V11c0 .55.45 1 1 1s1-.45 1-1V3.41l2.29 2.29c.18.19.43.3.71.3a1.003 1.003 0 00.71-1.71l-4-4C8.53.11 8.28 0 8 0s-.53.11-.71.29l-4 4A1.003 1.003 0 004 6zm11 5c-.55 0-1 .45-1 1v2H2v-2c0-.55-.45-1-1-1s-1 .45-1 1v3c0 .55.45 1 1 1h14c.55 0 1-.45 1-1v-3c0-.55-.45-1-1-1z" fillRule="evenodd"></path></svg></span>
                            <div className="bp3-button-text">Export</div>
                        </button>
                    </div>
                </div>
                <div className="right">
                    <a href="https://github.com/mikesci/open-overlay" className="btn-github" rel="noopener" target="_blank" aria-label="OpenOverlay Github">
                        <svg viewBox="0 0 16 16" width="16" height="16" className="octicon octicon-mark-github" aria-hidden="true"><path fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z" style={{ fill: "currentColor" }}></path></svg>
                        <span>Github</span>
                    </a>
                </div>
            </div>
            <div className="editor">
                <Suspense fallback={loadingFallback}>
                    <OverlayEditor width={1920} height={1080} overlay={initialOverlay} onOverlayChanged={onOverlayChanged} onUpload={onUploadAsset} />
                </Suspense>
            </div>
        </>
    );
};

export default Application;
