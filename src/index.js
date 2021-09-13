import * as R from "ramda";

import fetchAllApi from "./app/api.js";
import createGraph from "./app/graph-construction.js";
import launchReuseGraphBuilder from "./app/graph-reuse-rockets.js";
import Launch from "./app/class-launch.js";
import MonthSpacer from "./app/class-month-spacer.js";
import * as cytoscape from "cytoscape";
import popper from "cytoscape-popper";

import stylesArray from "./app/styles-array.js";

window.avifSupport = null;
async function supportsAvif() {
    if (!window.createImageBitmap) return false;
    const avifData =
        "data:image/avif;base64,AAAAFGZ0eXBhdmlmAAAAAG1pZjEAAACgbWV0YQAAAAAAAAAOcGl0bQAAAAAAAQAAAB5pbG9jAAAAAEQAAAEAAQAAAAEAAAC8AAAAGwAAACNpaW5mAAAAAAABAAAAFWluZmUCAAAAAAEAAGF2MDEAAAAARWlwcnAAAAAoaXBjbwAAABRpc3BlAAAAAAAAAAQAAAAEAAAADGF2MUOBAAAAAAAAFWlwbWEAAAAAAAAAAQABAgECAAAAI21kYXQSAAoIP8R8hAQ0BUAyDWeeUy0JG+QAACANEkA=";
    const blob = await fetch(avifData).then((r) => r.blob());
    return window.createImageBitmap(blob).then(
        () => true,
        () => false
    );
}
(async () => {
    const classAvif = (await supportsAvif()) ? "avif" : "no-avif";
    avifSupport = classAvif;
    document.body.classList.add(classAvif);
})();



cytoscape.use(popper);

const cy = cytoscape({
    container: document.getElementById("cy"),
    zoomingEnabled: false,
    userZoomingEnabled: false,
    panningEnabled: true,
    userPanningEnabled: false,
    style: stylesArray
});

fetchAllApi().then((response) => {
    let launchResponseSorted = R.sortBy(
        R.prop("date"),
        response.launches.map((launch) => new Launch(launch, avifSupport))
    );
    let minLaunch = R.head(launchResponseSorted);
    let minYear = minLaunch.launch_year;
    let maxYear = R.last(launchResponseSorted).launch_year;

    let spacedMonths = R.xprod(R.range(minYear, maxYear), R.range(0, 12))
        .map((combo) => {
            return new MonthSpacer(combo[0], combo[1]);
        })
        .filter((spacer) => spacer.date >= minLaunch.date);

    let combineMissionsWithMonths = R.sortBy(R.prop("date"), [
        ...spacedMonths,
        ...launchResponseSorted
    ]);

    createGraph(
        cy,
        combineMissionsWithMonths,
        launchReuseGraphBuilder(response.cores)
    );
});