import { randomBytes, randomInt, randomUUID } from 'node:crypto';

type PRNG = 'bytes' | 'int' | 'uuid';

const prng = (type: PRNG, size: number, min: number, max: number, encoding: BufferEncoding) => {
    switch (type) {
        case 'bytes':
            return randomBytes(size).toString(encoding);
        case 'int':
            const [low, high] = min <= max ? [min, max] : [max, min];
            return randomInt(low, high);
        case 'uuid':
            return randomUUID();
        default:
            throw new Error(`Unknown type: ${type}`);
    }
}

export default prng;