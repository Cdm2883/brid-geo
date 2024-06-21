module.exports = {
    extends: [ "next/core-web-vitals", "plugin:@typescript-eslint/recommended", "plugin:@typescript-eslint/stylistic" ],
    parser: "@typescript-eslint/parser",
    plugins: [
        "@next/eslint-plugin-next",
        "@typescript-eslint",
        "simple-import-sort",
    ],
    root: true,
    rules: {
        'comma-spacing': "off",
        '@typescript-eslint/comma-spacing': "error",
        '@typescript-eslint/member-delimiter-style': "error",
        '@typescript-eslint/no-unsafe-declaration-merging': "off",

        'array-bracket-spacing': [ "error", "always" ],
        'arrow-parens': [ "error", "as-needed" ],
        'indent': [ "error", 4, { SwitchCase: 1 } ],
        'object-curly-spacing': [ "error", "always" ],
        'semi': [ "error", "always" ],
        'spaced-comment': [ "error", "always", { markers: [ "/" ] } ],

        'simple-import-sort/imports': "error",
    },
}
