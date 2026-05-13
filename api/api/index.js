// Vercel serverless function entry. Re-exports the Express app produced by
// `npm run build` (which compiles src/ → dist/ and rewrites @/ aliases via
// tsc-alias). All requests are routed here by vercel.json rewrites.
module.exports = require('../dist/index').default;
