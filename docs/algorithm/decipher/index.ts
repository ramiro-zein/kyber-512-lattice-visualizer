import { createDecipheriv, scryptSync } from "crypto";
import { createReadStream, createWriteStream, PathLike } from "node:fs";
import { pipeline } from "node:stream";

const decipher = (
  password: string,
  salt: string,
  size: 128 | 192 | 256,
  input: PathLike,
  output: PathLike
) => {
  const decipher = createDecipheriv(
    `aes-${size}-cbc`,
    scryptSync(password, salt, size / 8),
    new Uint8Array(16)
  );

  pipeline(
    createReadStream(input),
    decipher,
    createWriteStream(output),
    (error) => {
      if (error) throw error;
    }
  );
};

export default decipher;
