'use client';

import { useCallback, useState } from "react";

import BridGeoScene from "./scene.js";

export default function Home({ params }) {
    const [ initialized, setInitialized ] = useState(false);

    const threeDivRef = useCallback(
        node => {
            if (node !== null && !initialized) {
                new BridGeoScene(node, params.level_id);
                setInitialized(true);
            }
        },
        [ initialized, params.level_id ]
    );

    return (
        <main>
            <div
                style={{
                    height: '100vh',
                    width: '100vw',
                }}
                ref={threeDivRef}
            ></div>
        </main>
    );
}
