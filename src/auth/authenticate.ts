import type { FastifyReply, FastifyRequest } from "fastify";
import type { ApiKey } from "@prisma/client";
import { prisma } from "../db";
import { hashApiKey } from "./keys";

declare module "fastify" {
    interface FastifyRequest {
        apiKey: ApiKey;
    }
}

export async function authenticate(request: FastifyRequest, reply: FastifyReply) {
    const header = request.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        return reply.code(401).send({ error: "missing API key" });
    }

    const rawKey = header.slice("Bearer ".length);
    const apiKey = await prisma.apiKey.findUnique({ where: { keyHash: hashApiKey(rawKey) } });

    if (!apiKey || apiKey.revokedAt) {
        return reply.code(401).send({ error: "invalid API key" });
    }

    request.apiKey = apiKey;
}