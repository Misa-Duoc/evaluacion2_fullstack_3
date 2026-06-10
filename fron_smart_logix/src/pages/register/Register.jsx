import { useState } from "react"
import { register } from "../../service/authService"
import "../../styles/login.css"

const EMPTY_FORM = {
    username: "",
    email: "",
    password: "",
    confirmPassword: ""
}

function RegisterPage({ handleRegisterSuccess }) {

    const [form, setForm]       = useState(EMPTY_FORM)
    const [message, setMessage] = useState("")
    const [success, setSuccess] = useState(false)
    const [loading, setLoading] = useState(false)

    function handleFieldChange(field, value) {
        setForm((prev) => ({ ...prev, [field]: value }))
    }

    async function handleSubmit(event) {
        event.preventDefault()
        setMessage("")

        // Validación de contraseñas coincidentes en el componente
        if (form.password !== form.confirmPassword) {
            setMessage("Las contraseñas no coinciden")
            return
        }

        setLoading(true)

        try {
            await register({
                username: form.username,
                email:    form.email,
                password: form.password
            })
            setSuccess(true)
            setMessage("¡Cuenta creada exitosamente! Ya puedes iniciar sesión.")
            setForm(EMPTY_FORM)
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
                    <p>Crear nueva cuenta</p>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label">Nombre de usuario</label>
                        <input
                            className="form-control"
                            value={form.username}
                            onChange={(e) => handleFieldChange("username", e.target.value)}
                            placeholder="ej: juan.perez"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input
                            className="form-control"
                            type="email"
                            value={form.email}
                            onChange={(e) => handleFieldChange("email", e.target.value)}
                            placeholder="correo@ejemplo.com"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Contraseña</label>
                        <input
                            className="form-control"
                            type="password"
                            value={form.password}
                            onChange={(e) => handleFieldChange("password", e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label">Confirmar contraseña</label>
                        <input
                            className="form-control"
                            type="password"
                            value={form.confirmPassword}
                            onChange={(e) => handleFieldChange("confirmPassword", e.target.value)}
                            placeholder="Repite tu contraseña"
                        />
                    </div>

                    <button className="btn-login" type="submit" disabled={loading}>
                        {loading ? "Creando cuenta..." : "Crear cuenta"}
                    </button>

                    {message && (
                        <p className={`login-message ${success ? "success" : ""}`}>
                            {message}
                        </p>
                    )}
                </form>

                <p style={{ textAlign: "center", marginTop: 16, fontSize: "0.875rem", color: "var(--color-text-secondary, #6b7280)" }}>
                    ¿Ya tienes cuenta?{" "}
                    <button
                        type="button"
                        onClick={handleRegisterSuccess}
                        style={{ background: "none", border: "none", color: "#7c3aed", cursor: "pointer", fontWeight: 600, padding: 0 }}
                    >
                        Iniciar sesión
                    </button>
                </p>
            </div>
        </main>
    )
}

export default RegisterPage
