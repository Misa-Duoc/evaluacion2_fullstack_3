import { useEffect, useState } from 'react'
import './App.css'
import LoginPage from './pages/Login'
import { clearLogin, getSaveToken } from './service/authService'
import ShipmentsPage from './pages/Shipments'
import OrderPage from './pages/Order'
import InventoryPage from './pages/Inventory'



const PRIVATE_ROUTER = [
  { key: "shipment", label: "shipment", hash: "#/shipment" },
  { key: "order", label: "order", hash: "#/order" },
  { key: "inventory", label: "inventory", hash: "#/inventory" }
]

function getRouterFromHash() {
  return window.location.hash.replace("#/", "")
}

function App() {
  const [isLogin, setIsLogin] = useState(Boolean(getSaveToken()))
  const [current, setCurrent] = useState(getRouterFromHash())

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
    if (current === "shipment") {
      return <ShipmentsPage />
    }

    if (current === "order") {
      return <OrderPage />
    }

    if (current === "inventory") {
      return <InventoryPage />
    }

    return <h1>Ruta no encontrada</h1>
  }

  function handleLoginSucces() {
    setIsLogin(true)
  }

  function handleLogout() {
    clearLogin()
    setIsLogin(false)
  }

  if (isLogin) {
    return (
      <div>
        <aside>
          <div>
            <div>
              <h2>Dashboard</h2>
            </div>

            <nav>
              {PRIVATE_ROUTER.map((route) => (
                <a
                  key={route.key}
                  href={route.hash}
                >
                  <span>{route.label}</span>
                </a>
              ))}
            </nav>
          </div>
          
        </aside>

        <section>
          {renderPrivate()}
        </section>
      </div>
    )
  }

  return <LoginPage handleLoginSucces={handleLoginSucces} />
}

export default App
