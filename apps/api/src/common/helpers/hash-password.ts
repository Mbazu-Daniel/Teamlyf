import { argon2id, hash, verify } from "argon2";

const argon2Options = {
  type: argon2id,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
} as const;

export async function hashPassword(password: string): Promise<string> {
  return hash(password, argon2Options);
}

export async function verifyPassword(data: { password: string; hash: string }): Promise<boolean> {
  return verify(data.hash, data.password);
}
