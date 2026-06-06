import { useState } from "react"

import { login, saveLoginSession } from "../service/authService"

function LoginPage({handleLoginSucces}){

    const [credential, setCredential] = useState("")
    const [password, setPassword] = useState("")
    const [message, setMessage] = useState("")

    async function handleSubmit(event) {
        event.preventDefault()
        setMessage("")

        try {
            const response = await login({
                credential,
                password
            })

            saveLoginSession(response)
            handleLoginSucces()

            setMessage("Login correcto")
        } catch (error) {
            setMessage(error.message)
        }
    }

    return(
        <main>
            <form onSubmit={handleSubmit} >
                <label>
                    Credenciales
                    <input
                        onChange={(event) => setCredential(event.target.value)}
                        value={credential}
                    />
                </label>
                <label>
                    Password
                    <input
                        onChange={(event) => setPassword(event.target.value)}
                        value={password}
                    />
                </label>

                <button className="" type="submit">
                    Log in
                </button>

                {message && <p>{message}</p>}
            </form>
        </main>
    )
}

export default LoginPage
