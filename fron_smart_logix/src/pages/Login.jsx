import { useState } from "react"
import { login, saveLoginSession } from "../service/authService"
import "../styles/login.css"

function LoginPage({ handleLoginSucces, onGoToRegister }) {

    const [credential, setCredential] = useState("")
    const [password, setPassword]     = useState("")
    const [message, setMessage]       = useState("")
    const [loading, setLoading]       = useState(false)

    async function handleSubmit(event) {
        event.preventDefault()
        setMessage("")
        setLoading(true)

        try {
            const response = await login({ credential, password })
            saveLoginSession(response)
            handleLoginSucces()
        } catch (error) {
            setMessage(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <main className="login-main">
            <div className="login-card">
                <div className="login-logo">
                    <h2>SmartLogix</h2>
                    <p>Sistema de gestión logística</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Usuario o email</label>
                        <input
                            className="form-control"
                            value={credential}
                            onChange={(e) => setCredential(e.target.value)}
                            placeholder="admin"
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Contraseña</label>
                        <input
                            className="form-control"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                        />
                    </div>

                    <button className="btn-login" type="submit" disabled={loading}>
                        {loading ? "Ingresando..." : "Ingresar"}
                    </button>

                    {message && <p className="login-message">{message}</p>}
                </form>

                <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.875rem", color: "var(--color-text-secondary, #6b7280)" }}>
                    ¿No tienes cuenta?{" "}
                    <button
                        type="button"
                        onClick={onGoToRegister}
                        style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontWeight: 600, padding: 0 }}
                    >
                        Crear una cuenta
                    </button>
                </p>
            </div>
        </main>
    )
}

export default LoginPage
