import mkcert from "vite-plugin-mkcert";

export default {
    server: {
        https: true,
    },
    plugins: [
        mkcert(),
    ],
    build: {
        rollupOptions: {
            output: {
                entryFileNames: "[name].js",
                chunkFileNames: "[name].js",
                assetFileNames: "[name].[ext]",
            },
        },
    },
}
