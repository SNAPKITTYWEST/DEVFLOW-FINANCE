import NextAuth from "next-auth"
import AzureADProvider from "next-auth/providers/azure-ad"

export default NextAuth({
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID!,
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async session({ session, token }) {
      return session
    },
    async jwt({ token, account }) {
      return token
    }
  },
  pages: {
    signIn: "/login",
    error: "/login"
  },
  debug: false
})
