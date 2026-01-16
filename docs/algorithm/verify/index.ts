import { createVerify, BinaryToTextEncoding } from "crypto";
import { PathLike, readFileSync } from 'fs';

const verify = (
    algorithm: 'RSA-SHA512',
    input: PathLike,
    publicKey: PathLike,
    signature: string,
    signatureEncoding: BinaryToTextEncoding
) => {
    const verify = createVerify(algorithm);
    verify.update(readFileSync(input));
    verify.end();
    return verify.verify(readFileSync(publicKey), signature, signatureEncoding);
}

export default verify;