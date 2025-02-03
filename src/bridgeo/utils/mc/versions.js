const versions = [
    /*   MIN         MAX    PROTOCOL      INTERNAL */
    [ "1.16.200", "1.16.201", 422,   /**/'1.16.201' ],
    [ "1.16.210", null      , 428,   /**/'1.16.210' ],
    [ "1.16.220", "1.16.221", 431,   /**/'1.16.220' ],
    [ "1.17.0"  , "1.17.2"  , 440,   /**/'1.17.0'   ],
    [ "1.17.10" , "1.17.11" , 448,   /**/'1.17.10'  ],
    [ "1.17.30" , "1.17.34" , 465,   /**/'1.17.30'  ],
    [ "1.17.40" , "1.17.41" , 471,   /**/'1.17.40'  ],
    [ "1.18.0"  , null      , 475,   /**/'1.18.0'   ],
    [ "1.18.10" , "1.18.11" , 486,   /**/'1.18.11'  ],
    [ "1.18.30" , null      , 503,   /**/'1.18.30'  ],
    [ "1.19.0"  , "1.19.1"  , 527,   /**/'1.19.1'   ],
    [ "1.19.10" , null      , 534,   /**/'1.19.10'  ],
    [ "1.19.20" , null      , 544,   /**/'1.19.20'  ],
    [ "1.19.21" , null      , 545,   /**/'1.19.21'  ],
    [ "1.19.30" , null      , 554,   /**/'1.19.30'  ],
    [ "1.19.40" , "1.19.41" , 557,   /**/'1.19.40'  ],
    [ "1.19.50" , null      , 560,   /**/'1.19.50'  ],
    [ "1.19.60" , null      , 567,   /**/'1.19.60'  ],
    [ "1.19.62" , "1.19.63" , 568,   /**/'1.19.62'  ],
    [ "1.19.70" , "1.19.72" , 575,   /**/'1.19.70'  ],
    [ "1.19.80" , null      , 582,   /**/'1.19.80'  ],
    [ "1.20.0"  , null      , 589,   /**/'1.20.0'   ],
    [ "1.20.10" , "1.20.15" , 594,   /**/'1.20.10'  ],
    [ "1.20.30" , "1.20.32" , 618,   /**/'1.20.30'  ],
    [ "1.20.40" , "1.20.41" , 622,   /**/'1.20.40'  ],
    [ "1.20.50" , "1.20.51" , 630,   /**/'1.20.50'  ],
    [ "1.20.60" , "1.20.62" , 649,   /**/'1.20.61'  ],
    [ "1.20.70" , "1.20.73" , 662,   /**/'1.20.71'  ],
    [ "1.20.80" , "1.20.81" , 671,   /**/'1.20.80'  ],
    [ "1.21.0"  , "1.21.1"  , 685,   /**/'1.21.0'   ],
    [ "1.21.2"  , null      , 686,   /**/'1.21.2'   ],
    [ "1.21.20" , "1.21.23" , 712,   /**/'1.21.21'  ],
    [ "1.21.30" , "1.21.31" , 729,   /**/'1.21.30'  ],
    [ "1.21.40" , "1.21.44" , 748,   /**/'1.21.42'  ],
    [ "1.21.50" , "1.21.51" , 766,   /**/'1.21.50'  ],
    // TODO more versions
];

function fixVersion(version) {
    if (!isNaN(Number(version))) version = Number(version);

    if (typeof version == 'number')
        for (let [ ,, protocol, internal ] of versions)
            if (protocol === version) return internal;

    if (typeof version == 'string')
        for (let [ min, max,, internal ] of versions) {
            if (version === internal) return internal;
            if (min === version) return internal;
            if (max === version) return internal;
            if (min == null || max == null) continue;

            const parseVersion = v => v.split('.').map(Number);
            const v = parseVersion(version);
            const minV = parseVersion(min);
            const maxV = parseVersion(max);
            if (
                v >= minV &&
                v <= maxV &&
                (v[0] !== minV[0] || v[1] !== minV[1] || v[2] !== minV[2]) &&
                (v[0] !== maxV[0] || v[1] !== maxV[1] || v[2] !== maxV[2])
            ) return internal;
        }

    return versions[versions.length - 1][3];  // latest support
}

function getProtocol(version) {
    version = fixVersion(version);
    return versions
        .find(([ ,,, internal ]) => version === internal)
        ?.[2] || NaN;
}

export { versions, fixVersion, getProtocol };
