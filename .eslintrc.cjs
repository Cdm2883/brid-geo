module.exports = {
    extends: ["next/core-web-vitals"],
    plugins: [
        "@next/eslint-plugin-next",
        "simple-import-sort"
    ],
    rules: {
        indent: ["error", 4],
        semi: ["error", "always"],
        'spaced-comment': ["error", "always"],
        'array-bracket-spacing': ["error","always"],
        'object-curly-spacing': ["error","always"],
        'simple-import-sort/imports': "error"
    }
}
