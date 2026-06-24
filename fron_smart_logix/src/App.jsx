import { useEffect, useState } from 'react'
import './styles/layout.css'
import LoginPage from './pages/Login'
import RegisterPage from './pages/register/Register'
import { clearLogin, getSaveToken, getSaveUser } from './service/authService'
import ShipmentsPage from './pages/Shipments'
import OrderPage from './pages/Order'
import InventoryPage from './pages/Inventory'
import DispatchPointsPage from './pages/DispatchPoints'

const PRIVATE_ROUTER = [
  { key: "shipment",  label: "📦 Envíos",    hash: "#/shipment" },
  { key: "order",     label: "🧾 Órdenes",   hash: "#/order" },
  { key: "inventory", label: "🏭 Inventario", hash: "#/inventory" },
  { key: "points",    label: "⭐ Puntos",     hash: "#/points" }
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

  function renderPrivate() {
    if (current === "shipment")  return <ShipmentsPage />
    if (current === "order")     return <OrderPage />
    if (current === "inventory") return <InventoryPage />
    if (current === "points")    return <DispatchPointsPage />
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
    return (
      <div className="app-layout">
        <aside className="sidebar">
          <div className="sidebar-brand">
            <h2>SmartLogix</h2>
            {user && <p className="sidebar-user">{user.username} — {user.role}</p>}
          </div>

          <nav className="sidebar-nav">
            {PRIVATE_ROUTER.map((route) => (
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
          {renderPrivate()}
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
