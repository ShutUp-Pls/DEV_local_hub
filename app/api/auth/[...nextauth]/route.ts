// app/api/auth/[...nextauth]/route.ts
import NextAuth, { DefaultSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        remember: { label: "Remember Me", type: "text" } 
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials?.username,
              password: credentials?.password,
            }),
          });

          const user = await res.json();

          if (res.ok && user) {
            return { 
                ...user, 
                remember: credentials?.remember === "true" 
            };
          }
          return null;
        } catch (e) {
          console.error("Error conectando con backend:", e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // 1. Lógica inicial al Loguearse
      if (user) {
        token.username = (user as any).username;
        token.remember = (user as any).remember;
        
        const currentTime = Math.floor(Date.now() / 1000);
        
        if (token.remember) {
           token.expiresAt = currentTime + (30 * 24 * 60 * 60); // 30 días
        } else {
           token.expiresAt = currentTime + 3600; // 1 hora
        }
      }

      // 2. Lógica de validación en cada request (incluyendo refetchInterval)
      if (token.expiresAt) {
        const currentTime = Math.floor(Date.now() / 1000);
        
        // Si el tiempo actual superó el tiempo de expiración guardado
        if (currentTime > (token.expiresAt as number)) {
            // Retornamos un objeto vacío o nulo para invalidar el token
            return {}; 
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      // Si el token no tiene username (porque retornamos {} en jwt al expirar)
      if (!token || !token.username) {
         // CORRECCIÓN: Retornar objeto vacío {} en lugar de null.
         // Retornar 'null' causa el error de cliente; un objeto vacío indica "no autenticado" limpiamente.
         return {} as any; 
      }

      if (session.user) {
        // @ts-ignore
        session.user.name = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: '/',
  },
  session: {
    strategy: "jwt",
    // Dejamos el maxAge global en 30 días para que la cookie persista
    // en el caso de "Recordarme", pero nuestra lógica interna (arriba)
    // la matará a los 10 segundos si no marcó la casilla.
    maxAge: 30 * 24 * 60 * 60, 
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };