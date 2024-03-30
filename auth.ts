import NextAuth from 'next-auth'
import { authConfig } from './auth.config'
// import Credentials from 'next-auth/providers/credentials'
import GitLab from 'next-auth/providers/gitlab'
// import { getUser } from './app/login/actions'
// import { getStringFromBuffer } from './lib/utils'
// import { z } from 'zod'

export const {
  auth,
  signIn,
  signOut,
  handlers: { GET, POST }
} = NextAuth({
  ...authConfig,
  providers: [
    // Credentials({
    //   async authorize(credentials) {
    //     const parsedCredentials = z
    //       .object({
    //         email: z.string().email(),
    //         password: z.string().min(6)
    //       })
    //       .safeParse(credentials)

    //     if (parsedCredentials.success) {
    //       const { email, password } = parsedCredentials.data
    //       const user = await getUser(email)

    //       if (!user) return null

    //       const encoder = new TextEncoder()
    //       const saltedPassword = encoder.encode(password + user.salt)
    //       const hashedPasswordBuffer = await crypto.subtle.digest(
    //         'SHA-256',
    //         saltedPassword
    //       )
    //       const hashedPassword = getStringFromBuffer(hashedPasswordBuffer)

    //       if (hashedPassword === user.password) {
    //         return user
    //       } else {
    //         return null
    //       }
    //     }

    //     return null
    //   }
    // }),
    GitLab({
      authorization: `${process.env.GITLAB_URL}/oauth/authorize?scope=read_user`,
      token: `${process.env.GITLAB_URL}/oauth/token`,
      userinfo: `${process.env.GITLAB_URL}/api/v4/user`,
      clientId: process.env.GITLAB_CLIENT_ID,
      clientSecret: process.env.GITLAB_CLIENT_SECRET
    }),
    {
      id: 'bi',
      name: 'bi',
      type: 'oauth',
      checks: ['none'],
      clientId: process.env.BI_CLIENT_ID,
      clientSecret: process.env.BI_CLIENT_SECRET,
      authorization: `${process.env.BI_URL}/user-authorize?clientName=${process.env.BI_CLIENT_NAME}`,
      userinfo: {
        url: `${process.env.BI_URL}/api/me`,
        async request(context: any) {
          if (typeof context.tokens.access_token === 'undefined') {
            throw new Error('access_token is not defined')
          }

          const data = await fetch(`${process.env.BI_URL}/api/me`, {
            method: 'GET',
            headers: {
              authorization: `Bearer ${context.tokens.access_token}`,
              'content-type': 'application/json'
            }
          }).then(async res => await res.json())

          return {
            sub: data.id,
            name: data.name,
            email: data.email
          }
        }
      },
      token: {
        url: `${process.env.BI_URL}/oauth/token`,
        async request(context: any) {
          try {
            const data = await fetch(`${process.env.BI_URL}/oauth/token`, {
              method: 'POST',
              headers: {
                'content-type': 'application/json'
              },
              body: JSON.stringify({
                grant_type: 'authorization_code',
                client_id: process.env.BI_CLIENT_ID,
                client_secret: process.env.BI_CLIENT_SECRET,
                redirect_uri: context.provider.callbackUrl,
                code: context.params.code
              })
            }).then(async res => await res.json())

            return {
              tokens: {
                access_token: data.access_token
              }
            }
          } catch (err: any) {
            if (typeof err.response?.data?.message === 'string') {
              throw new Error(err.response.data.message)
            }

            throw err
          }
        }
      },
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture
        }
      }
    }
  ]
})
