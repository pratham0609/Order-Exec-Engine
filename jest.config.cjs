// module.exports = {
//   preset: 'ts-jest',
//   testEnvironment: 'node',
//   testTimeout: 10000,
//   roots: ['<rootDir>/tests'],
//   moduleFileExtensions: ['ts','js','json','node'],
//   testMatch: [
//     "**/tests/**/*.test.ts",
//     "**/tests/**/*.test.cjs",
//   ],
//   transform: {
//     "^.+\\.ts?$": "ts-jest",
//   },
//   // transform: {},
//   // extensionsToTreatAsEsm: [".ts"],
// };

module.exports = {
  testMatch: [
    "**/tests/**/*.test.ts",
    "**/tests/**/*.test.cjs",
  ],
  transform: {
    "^.+\\.ts?$": "ts-jest",
  },
};
