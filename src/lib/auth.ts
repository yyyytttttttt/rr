
import NextAuth, { DefaultSession, type NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "../lib/prizma";
import bcrypt from "bcrypt";

// Кэш tokenVersion для уменьшения нагрузки на БД
// TTL: 60 секунд - баланс между безопасностью и производительностью
interface TokenVersionCache {
    version: number;
    timestamp: number;
}
const tokenVersionCache = new Map<string, TokenVersionCache>();
const TOKEN_VERSION_CACHE_TTL = 60 * 1000; // 60 секунд
const MAX_CACHE_SIZE = 10000;

function getCachedTokenVersion(userId: string): number | null {
    const cached = tokenVersionCache.get(userId);
    if (!cached) return null;
    if (Date.now() - cached.timestamp > TOKEN_VERSION_CACHE_TTL) {
        tokenVersionCache.delete(userId);
        return null;
    }
    return cached.version;
}

function setCachedTokenVersion(userId: string, version: number): void {
    // Ограничиваем размер кэша
    if (tokenVersionCache.size >= MAX_CACHE_SIZE) {
        // Удаляем самую старую запись
        const oldestKey = tokenVersionCache.keys().next().value;
        if (oldestKey) tokenVersionCache.delete(oldestKey);
    }
    tokenVersionCache.set(userId, { version, timestamp: Date.now() });
}

// Экспортируем для инвалидации при смене пароля
export function invalidateTokenVersionCache(userId: string): void {
    tokenVersionCache.delete(userId);
}

// Очистка устаревших записей каждые 5 минут
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of tokenVersionCache.entries()) {
        if (now - value.timestamp > TOKEN_VERSION_CACHE_TTL) {
            tokenVersionCache.delete(key);
        }
    }
}, 5 * 60 * 1000);



declare module "next-auth" {
        interface User {
        id: string;
        role: "USER" | "DOCTOR" | "ADMIN";
        tokenVersion: number;
    }
    interface Session {
        user:{
            id:string
            role: "USER" | "DOCTOR" | "ADMIN"
        } & DefaultSession['user']

    }
}
declare module "next-auth/jwt"{
    interface JWT {
        role?: "USER" | "DOCTOR" | "ADMIN"
        tokenVersion?:number
        
    }
}
export const authOptions:NextAuthOptions ={


    adapter:PrismaAdapter(prisma),
    session:{
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 7,
    },

    secret:process.env.NEXTAUTH_SECRET,
    providers:[
        Credentials({
            name:'Email & Password',
            credentials:{email:{},password:{}},
            async authorize(creds){
                try {
                    console.log('[AUTH] Starting authorization...');
                    const email = (creds?.email || '').trim().toLowerCase()
                    const password=(creds?.password || '')

                    if (!email || !password) {
                        console.log('[AUTH] Missing email or password');
                        return null;
                    }

                    console.log('[AUTH] Looking up user:', email);
                    const user = await prisma.user.findUnique({where:{email}})

                    if (!user?.password) {
                        console.log('[AUTH] User not found or no password');
                        return null;
                    }

                    if (!user.emailVerified) {
                        console.log('[AUTH] Email not verified');
                        throw new Error("EMAIL_NOT_VERIFIED")
                    }

                    const ok = await bcrypt.compare(password,user.password)
                    if (!ok) {
                        console.log('[AUTH] Password mismatch');
                        return null;
                    }

                    console.log('[AUTH] Authorization successful');
                    return {
                        id:user.id,
                        email:user.email,
                        name:user.name,
                        role:user.role,
                        tokenVersion:user.tokenVersion?? 0
                    }
                } catch (error: any) {
                    console.error('[AUTH] Authorization error:', error);
                    // Пробрасываем ошибку EMAIL_NOT_VERIFIED для обработки на фронтенде
                    if (error.message === "EMAIL_NOT_VERIFIED") {
                        throw error;
                    }
                    return null;
                }
            }


        })
    ],
    
    callbacks :{

        async jwt({token,user,trigger,session}) {
            try {
                if (user){
                    token.role=user.role
                    token.tokenVersion=user.tokenVersion??0
                    return token;
                }

                if (trigger === 'update' && session?.user?.role) {
                    token.role = session.user.role
                }

                // Проверяем tokenVersion только если это не первый вход
                if (token.sub && token.tokenVersion !== undefined){
                    // Сначала проверяем кэш
                    let dbTokenVersion = getCachedTokenVersion(token.sub);

                    if (dbTokenVersion === null) {
                        // Кэш пуст или устарел - запрашиваем из БД
                        const s = await prisma.user.findUnique({
                            where :{id: token.sub},
                            select :{tokenVersion: true}
                        });

                        if (!s) {
                            console.log('User not found, clearing session');
                            return {} as any;
                        }

                        dbTokenVersion = s.tokenVersion;
                        setCachedTokenVersion(token.sub, dbTokenVersion);
                    }

                    // Если версия не совпадает - сбрасываем сессию
                    if (dbTokenVersion !== token.tokenVersion){
                        console.log('Token version mismatch, clearing session');
                        return {} as any;
                    }
                }

                return token;
            } catch (error) {
                console.error('[JWT] Error in jwt callback:', error);
                // Возвращаем токен как есть, чтобы не ломать сессию
                return token;
            }
        },

        async session({ session, token }) {
            // Если токен пустой (после сброса), не создаем сессию
            if (!token?.sub) return session;

            session.user = {
                ...(session.user ?? {}),
                id: token.sub,
                role: (token.role as any) ?? "USER",
            };
            return session;
        },
    },
            pages:{
                signIn:"/Login",
                error: "/Login",
            }

   
}
export default NextAuth(authOptions);

 