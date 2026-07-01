import { useEffect, useState } from 'react'
import './styles/layout.css'
import LoginPage from './pages/Login'
import RegisterPage from './pages/register/Register'
import { clearLogin, getSaveToken, getSaveUser } from './service/authService'
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

function App() {
  const [isLogin, setIsLogin]       = useState(Boolean(getSaveToken()))
  const [showRegister, setShowRegister] = useState(false)
  const [current, setCurrent]       = useState(getRouterFromHash())

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

  function canAccess(routeKey, role) {
    const route = PRIVATE_ROUTER.find((r) => r.key === routeKey)
    return Boolean(route && route.roles.includes(role))
  }

  function renderPrivate(role) {
    // Guardia por rol: si el usuario navega (por URL) a una sección no permitida,
    // se le muestra un aviso en lugar de la pantalla restringida.
    if (current && !canAccess(current, role)) {
      return (
        <main>
          <div className="page-header"><h2>🔒 Acceso restringido</h2></div>
          <p className="state-msg error">
            No tienes permisos para acceder a esta sección con el rol <strong>{role}</strong>.
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
    setIsLogin(true)
    setShowRegister(false)
    window.location.hash = "#/shipment"
  }

  function handleLogout() {
    clearLogin()
    setIsLogin(false)
  }

  // Vista privada — usuario autenticado
  if (isLogin) {
    const user = getSaveUser()
    const role = user?.role ?? "ROLE_USER"
    // El menú se filtra según el rol del usuario.
    const menu = PRIVATE_ROUTER.filter((route) => route.roles.includes(role))

    return (
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h2>SmartLogix</h2>
            {user && <p className="sidebar-user">{user.username} — {user.role}</p>}
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
    <LoginPage
      handleLoginSucces={handleLoginSucces}
      onGoToRegister={() => setShowRegister(true)}
    />
  )
}

export default App
