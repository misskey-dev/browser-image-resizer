import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: [
        './src/index.ts',
        './src/algorithms/bilinear.ts',
        './src/algorithms/hermite.ts',
        './src/algorithms/hermite_single.ts',
    ],
    outExtensions: (_) => ({ js: '.js', dts: '.d.ts' }),
    tsconfig: true,
    dts: true,
});
