// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
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
            // Pasamos la preferencia del usuario al objeto user
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
      if (user) {
        token.username = (user as any).username;
        token.remember = (user as any).remember; 
      }

      // Calculamos el tiempo actual
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Si ya existe una expiración previa (token.exp), la respetamos o la sobrescribimos.
      // Pero para este caso, la definimos fresca en el login:

      if (token.remember) {
          // Si marcó "Recordar": 30 días
          // (Si user es undefined, significa que es una sesión ya iniciada, mantenemos la exp)
          if (user) token.exp = currentTime + (30 * 24 * 60 * 60);
      } else {
          // 🧪 MODO EXPERIMENTO: 
          // Si NO marcó "Recordar": 10 SEGUNDOS
          if (user) token.exp = currentTime + 10; 
      }
      
      return token;
    },
    async session({ session, token }) {
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
    // Establecemos el máximo absoluto a 30 días. 
    // La callback JWT reducirá esto si el usuario no eligió "recordarme".
    maxAge: 30 * 24 * 60 * 60, 
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };