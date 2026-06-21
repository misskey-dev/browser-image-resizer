import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: './src/index.ts',
    outExtensions: (_) => ({ js: '.js', dts: '.d.ts' }),
    tsconfig: true,
    dts: true,
});
