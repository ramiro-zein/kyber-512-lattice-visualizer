import { createCipheriv, scryptSync } from "crypto";
import { createReadStream, createWriteStream, PathLike } from "node:fs";
import { pipeline } from "node:stream";

const cipher = (
  password: string,
  salt: string,
  size: 128 | 192 | 256,
  input: PathLike,
  output: PathLike
) => {
  const cipher = createCipheriv(
    `aes-${size}-cbc`,
    scryptSync(password, salt, size / 8),
    new Uint8Array(16)
  );

  pipeline(
    createReadStream(input),
    cipher,
    createWriteStream(output),
    (error) => {
      if (error) throw error;
    }
  );
};

export default cipher;
