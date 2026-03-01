import type { Env } from "../db/client";
import type { User } from "../db/schema";

// Cloudflare Workers bindings + env
export type AppEnv = {
  Bindings: Env;
  Variables: {
    user: User;
    userId: string;
  };
};
