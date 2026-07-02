import { useEffect, useState } from 'react'
import './styles/layout.css'
import LoginPage from './pages/Login'
import RegisterPage from './pages/register/Register'
import { clearLogin, getSaveToken, getSaveUser, validateSession } from './service/authService'
import { AUTH_REJECTED_EVENT } from './api/httpClient'
import ShipmentsPage from './pages/Shipments'
import OrderPage from './pages/Order'
import InventoryPage from './pages/Inventory'
import DispatchPointsPage from './pages/DispatchPoints'
import CanjePuntosPage from './pages/CanjePuntos'
import DescuentoPage from './pages/Descuento'

// Cada sección declara qué roles pueden verla.
//  - ROLE_USER: solo puede INGRESAR un cupón de descuento y VISUALIZAR los envíos.
//  - ROLE_ADMIN: ve todo (incluye aceptar cupones, órdenes, inventario y puntos).
const PRIVATE_ROUTER = [
  { key: "shipment",  label: "📦 Envíos",        hash: "#/shipment",  roles: ["ROLE_USER", "ROLE_ADMIN"] },
  { key: "descuento", label: "🏷️ Descuento",     hash: "#/descuento", roles: ["ROLE_USER", "ROLE_ADMIN"] },
  { key: "order",     label: "🧾 Órdenes",       hash: "#/order",     roles: ["ROLE_ADMIN"] },
  { key: "inventory", label: "🏭 Inventario",    hash: "#/inventory", roles: ["ROLE_ADMIN"] },
  { key: "points",    label: "⭐ Puntos",         hash: "#/points",    roles: ["ROLE_ADMIN"] },
  { key: "redeem",    label: "🎁 Canje de ptos", hash: "#/redeem",    roles: ["ROLE_ADMIN"] }
]

function getRouterFromHash() {
  return window.location.hash.replace("#/", "")
}

// Estados posibles de la sesión mientras se resuelve la carga inicial:
//  - "checking": todavía no se confirmó nada contra el backend (incluye F5).
//    En este estado NUNCA se pinta contenido privado, para evitar el
//    "parpadeo" de un rol/menu que luego resulta invalido.
//  - "in": sesión confirmada por el backend, con el rol REAL del JWT.
//  - "out": sin sesión válida.
function App() {
  const [authStatus, setAuthStatus]     = useState("checking")
  const [role, setRole]                 = useState(null)
  const [showRegister, setShowRegister] = useState(false)
  const [current, setCurrent]           = useState(getRouterFromHash())
  const [sessionNotice, setSessionNotice] = useState(null)

  useEffect(() => {
    function handleHashChange() {
      setCurrent(getRouterFromHash())
    }
    window.addEventListener("hashchange", handleHashChange)
    handleHashChange()
    return () => {
      window.removeEventListener("hashchange", handleHashChange)
    }
  }, [])

  useEffect(() => {
    // Al montar la app (esto incluye recargar con F5) no confiamos en el rol
    // que haya quedado en localStorage: se confirma contra el backend
    // (GET /api/auth/validate), que devuelve el rol extraido del JWT firmado.
    // Mientras esa respuesta no llega, authStatus sigue en "checking" y no
    // se renderiza ninguna sección privada ni el menú de admin.
    let cancelled = false

    async function checkSession() {
      if (!getSaveToken()) {
        if (!cancelled) setAuthStatus("out")
        return
      }
      const realRole = await validateSession()
      if (cancelled) return

      if (realRole) {
        setRole(realRole)
        setAuthStatus("in")
      } else {
        setAuthStatus("out")
      }
    }

    checkSession()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    // El menu/rol que se ve en pantalla viene de localStorage y puede ser
    // manipulado desde DevTools, pero cada llamada al backend se valida contra
    // el JWT firmado. Si el backend responde 401/403, la sesion local quedo
    // desincronizada (token vencido o rol falseado) y se cierra sesion en el
    // acto, sin importar que la UI haya mostrado una seccion no autorizada.
    function handleAuthRejected(event) {
      clearLogin()
      setRole(null)
      setAuthStatus("out")
      setSessionNotice(
        event.detail?.status === 403
          ? "Tu sesión no tiene permisos para esa sección. Se cerró sesión por seguridad."
          : "Tu sesión expiró o no es válida. Inicia sesión nuevamente."
      )
      window.location.hash = ""
    }
    window.addEventListener(AUTH_REJECTED_EVENT, handleAuthRejected)
    return () => {
      window.removeEventListener(AUTH_REJECTED_EVENT, handleAuthRejected)
    }
  }, [])

  function canAccess(routeKey, currentRole) {
    const route = PRIVATE_ROUTER.find((r) => r.key === routeKey)
    return Boolean(route && route.roles.includes(currentRole))
  }

  function renderPrivate(currentRole) {
    // Guardia por rol: si el usuario navega (por URL) a una sección no permitida,
    // se le muestra un aviso en lugar de la pantalla restringida.
    if (current && !canAccess(current, currentRole)) {
      return (
        <main>
          <div className="page-header"><h2>🔒 Acceso restringido</h2></div>
          <p className="state-msg error">
            No tienes permisos para acceder a esta sección con el rol <strong>{currentRole}</strong>.
          </p>
          <p className="state-msg loading">
            Usa el menú para ir a <strong>Envíos</strong> o <strong>Descuento</strong>.
          </p>
        </main>
      )
    }

    if (current === "shipment")  return <ShipmentsPage />
    if (current === "descuento") return <DescuentoPage />
    if (current === "order")     return <OrderPage />
    if (current === "inventory") return <InventoryPage />
    if (current === "points")    return <DispatchPointsPage />
    if (current === "redeem")    return <CanjePuntosPage />
    return <p className="state-msg loading" style={{ margin: 32 }}>Selecciona una sección del menú.</p>
  }

  function handleLoginSucces() {
    // El login recien confirmado ya vino firmado y autoritativo desde el
    // backend (saveLoginSession lo acaba de guardar), asi que no hace falta
    // otra ronda de validacion para el primer render.
    const user = getSaveUser()
    setRole(user?.role ?? "ROLE_USER")
    setAuthStatus("in")
    setShowRegister(false)
    setSessionNotice(null)
    window.location.hash = "#/shipment"
  }

  function handleLogout() {
    clearLogin()
    setRole(null)
    setAuthStatus("out")
  }

  // Mientras se confirma la sesión contra el backend (incluye cada F5) no se
  // pinta ni el menú privado ni el formulario de login, para no revelar ni
  // por un instante secciones que luego resulten no autorizadas.
  if (authStatus === "checking") {
    return (
      <main className="login-main">
        <p className="state-msg loading">Verificando sesión...</p>
      </main>
    )
  }

  // Vista privada — sesión confirmada por el backend
  if (authStatus === "in") {
    const user = getSaveUser()
    // El menú se filtra según el rol confirmado por el backend, no el de localStorage.
    const menu = PRIVATE_ROUTER.filter((route) => route.roles.includes(role))

    return (
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h2>SmartLogix</h2>
            {user && <p className="sidebar-user">{user.username} — {role}</p>}
          </div>

          <nav className="sidebar-nav">
            {menu.map((route) => (
              <a
                key={route.key}
                href={route.hash}
                className={current === route.key ? "active" : ""}
              >
                {route.label}
              </a>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="btn-logout" type="button" onClick={handleLogout}>
              🚪 Cerrar sesión
            </button>
          </div>
        </aside>

        <div className="main-content">
          {renderPrivate(role)}
        </div>
      </div>
    )
  }

  // Vista pública — login o registro
  if (showRegister) {
    return (
      <RegisterPage
        handleRegisterSuccess={() => setShowRegister(false)}
      />
    )
  }

  return (
    <>
      {sessionNotice && (
        <div className="session-alert" role="alert">
          <span className="session-alert-icon" aria-hidden="true">!</span>
          <span className="session-alert-text">{sessionNotice}</span>
          <button
            type="button"
            className="session-alert-close"
            aria-label="Cerrar aviso"
            onClick={() => setSessionNotice(null)}
          >
            ×
          </button>
        </div>
      )}
      <LoginPage
        handleLoginSucces={handleLoginSucces}
        onGoToRegister={() => setShowRegister(true)}
      />
    </>
  )
}

export default App
