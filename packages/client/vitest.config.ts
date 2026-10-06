import { defineProject } from 'vitest/config';

export default defineProject({
    test: {
        name: 'client',
        include: ['tests/**/*.test.ts'],
    },
});
