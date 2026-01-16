import { createHmac, BinaryToTextEncoding } from "crypto";
import { readFileSync, PathLike } from "fs";

const hmac = (
  algorithm: string,
  key: string,
  encoding: BinaryToTextEncoding,
  input: PathLike
) => {
  return createHmac(algorithm, Buffer.from(key))
    .update(readFileSync(input))
    .digest(encoding);
};

export default hmac;
