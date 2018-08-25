module.exports = (wallaby) => ({
    files: ["src/**/*.ts?(x)"],
    tests: ["_tests/**/*.test.ts?(x)"],

    testFramework: "jest",
    env: {
        type: "node",
        runner: "node"
    },

    compilers: {
        "**/*.ts": wallaby.compilers.babel({
            babel: require("@babel/core"),
            babelrc: true
        })
    }
})