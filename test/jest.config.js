/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  testEnvironment: 'node',
  testRegex: '.spec.ts$',
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest"
  },
  rootDir: '../',
  moduleNameMapper: {
    "^src/(.*)": "<rootDir>/src/$1",
    reporters: [
      "default",
      "jest-junit"
    ]
  },
  collectCoverage: true,
  coverageDirectory: '../coverage',
  coverageReporters: ['json', 'lcov', 'text', 'clover'],
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/database/*.ts",
    "!src/configs/*.ts",
    "!src/main.ts",
    "!src/swagger.ts",
    "!src/app.module.ts",
    "!src/**/*.module.ts",
    "!src/Application/dtos/*.ts",
    "!src/Domain/Repositories/video.repository.ts"
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  detectOpenHandles: true,
  testTimeout: 2000000,
};
