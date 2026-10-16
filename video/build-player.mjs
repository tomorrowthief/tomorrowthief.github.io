import {build} from 'esbuild';

await build({
  entryPoints: ['src/home-player.tsx'],
  outfile: '../assets/js/personal-intro.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: ['es2020'],
  define: {'process.env.NODE_ENV': '"production"'},
  legalComments: 'eof',
});
