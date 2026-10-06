import { defineProject } from 'vitest/config';

export default defineProject({
    test: {
        name: 'games',
        include: ['tests/**/*.test.ts'],
        testTimeout: 15000,
    },
});
