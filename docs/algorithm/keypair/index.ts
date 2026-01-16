import { generateKeyPairSync, RSAKeyPairOptions, RSAPSSKeyPairOptions, KeyFormat } from "crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const keygen = (
    type: 'rsa' | 'rsa-pss',
    size: 128 | 192 | 256,
    passphrase: string,
    format: 'pem' | 'der',
    modulusLength: 2048 | 3072 | 4096
) => {
    switch (type) {
        case "rsa": {
            const options: RSAKeyPairOptions<KeyFormat, KeyFormat> = {
                modulusLength,
                publicKeyEncoding: {
                    type: "spki",
                    format
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format,
                    cipher: `aes-${size}-cbc`,
                    passphrase
                }
            }
            return generateKeyPairSync('rsa', options)
        }
        case "rsa-pss": {
            const options: RSAPSSKeyPairOptions<KeyFormat, KeyFormat> = {
                modulusLength,
                publicKeyEncoding: {
                    type: "spki",
                    format
                },
                privateKeyEncoding: {
                    type: 'pkcs8',
                    format,
                    cipher: `aes-${size}-cbc`,
                    passphrase
                }
            }
            return generateKeyPairSync('rsa-pss', options);
        }
    }
}

const keypair = (
    type: 'rsa' | 'rsa-pss',
    size: 128 | 192 | 256,
    passphrase: string,
    outDir: string,
    outFormat: 'pem' | 'der',
    modulusLength: 2048 | 3072 | 4096
) => {
    const { publicKey, privateKey } = keygen(type, size, passphrase, outFormat, modulusLength);
    mkdirSync(outDir, { recursive: true });
    writeFileSync(join(outDir, `public.${outFormat}`), publicKey.toString());
    writeFileSync(join(outDir, `private.${outFormat}`), privateKey.toString());
}

export default keypair;