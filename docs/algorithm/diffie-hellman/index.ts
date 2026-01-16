import * as crypto from 'crypto';

const diffieHellman = (encoding: crypto.BinaryToTextEncoding, from?: {
    prime: string;
    primeEncoding: crypto.BinaryToTextEncoding;
    generator: string;
    generatorEncoding: crypto.BinaryToTextEncoding;
    publicKey: string;
    publicKeyEncoding: crypto.BinaryToTextEncoding;
    privateKey: string
    privateKeyEncoding: crypto.BinaryToTextEncoding;
}) => {
    if (!from) {
        const dh = crypto.createDiffieHellmanGroup("modp14"); // 2048 bits
        const publicKey = dh.generateKeys();
        return {
            prime: dh.getPrime().toString(encoding),
            generator: dh.getGenerator().toString(encoding),
            publicKey: publicKey.toString(encoding),
            privateKey: dh.getPrivateKey().toString(encoding)
        };
    } else {
        const dh = from.generatorEncoding
            ? crypto.createDiffieHellman(
                from.prime, from.primeEncoding,
                from.generator, from.generatorEncoding
            )
            : crypto.createDiffieHellman(
                from.prime, from.primeEncoding,
                parseInt(from.generator, 10)
            );

        dh.setPrivateKey(from.privateKey, from.privateKeyEncoding);
        dh.generateKeys();

        const secret = dh.computeSecret(from.publicKey, from.publicKeyEncoding);

        return {
            prime: dh.getPrime().toString(encoding),
            generator: dh.getGenerator().toString(encoding),
            publicKey: dh.getPublicKey().toString(encoding),
            privateKey: dh.getPrivateKey().toString(encoding),
            secret: secret.toString(encoding)
        };
    }
}

export default diffieHellman;
