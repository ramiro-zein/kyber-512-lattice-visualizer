import { createHash, BinaryToTextEncoding } from "crypto";
import { PathLike, readFileSync } from "node:fs";

const hash = (
  algorithm: string,
  encoding: BinaryToTextEncoding,
  input: PathLike
) => {
  return createHash(algorithm).update(readFileSync(input)).digest(encoding);
};

export default hash;
