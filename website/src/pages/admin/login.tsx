import * as React from "react"
import { RouteComponentProps } from "@reach/router"
import { GoogleLogin, GoogleLoginResponse } from "react-google-login"

import Section, { SectionTitle } from "../../components/Section"
import Alert from "../../components/Alert"
import logo from "../../images/logo.png"
import { useAuthState, useRawAxios } from "../../components/networking"

const requiredScopes = [
  "email",
  "profile",
  "openid",
  "https://www.googleapis.com/auth/userinfo.profile",
]

const Login: React.FC<RouteComponentProps> = () => {
  const [_, setAuth] = useAuthState()
  const [error, setError] = React.useState<string | undefined>()

  const axios = useRawAxios()

  return (
    <Section className="mt-8 text-center">
      <img alt="" src={logo} height={60} width={95} className="mb-8" />
      <div className="max-w-lg bg-black bg-opacity-20 rounded p-8 mx-auto">
        <SectionTitle>Admin Login</SectionTitle>
        {error && <Alert variant="error" className="-mt-2 mb-4">{error}</Alert>}
        <GoogleLogin
          clientId="730827052132-u1tatnr4anip3vf7j5tq82k33gb5okpe.apps.googleusercontent.com"
          scope={requiredScopes.join(" ")}
          onRequest={() => {
            setError(undefined)
          }}
          onSuccess={async (_res) => {
            // FIXME: bad typescript definitions
            // https://github.com/anthonyjgrove/react-google-login/pull/482
            const res = _res as GoogleLoginResponse

            const grantedScopes = res.tokenObj.scope.split(" ")
            const missingScopes = requiredScopes.filter((s) => !grantedScopes.includes(s))
            if (missingScopes.length > 0) {
              setError(`Missing scopes: ${JSON.stringify(missingScopes)}`)
            } else {
              const loginResponse = await axios.post<{ accessToken: string, expiresAt: number }>("/admin/login", { idToken: res.tokenId, accessToken: res.accessToken })
              setAuth({ token: loginResponse.data.accessToken, expiresAt: loginResponse.data.expiresAt })
            }
          }}
          onFailure={(err) => {
            // eslint-disable-next-line no-console
            console.error(err)
            const errorMessage = [err.message, err.error, err.details].filter((s) => s).join(": ")
            setError(errorMessage.length > 0 ? errorMessage : String(err))
          }}
          // FIXME: This is a hack to get styles working
          // https://github.com/anthonyjgrove/react-google-login/issues/201
          // className="rounded px-2"
          className="raise-google-button"
        />
      </div>
    </Section>
  )
}

export default Login