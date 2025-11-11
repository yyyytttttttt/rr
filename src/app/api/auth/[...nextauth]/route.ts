import NextAuth from "next-auth";
import { authOptions} from "../../../../lib/auth";
import GoggleProvider from 'next-auth/providers/google'
const handler =NextAuth(authOptions)

export {handler as GET , handler as POST}
