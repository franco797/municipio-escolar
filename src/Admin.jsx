import { useState, useEffect } from "react";
import "./Admin.css";

function Admin({
  supabase,
  cerrarSesionAdmin,
  volverAElecciones,
}) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [errorAdmin, setErrorAdmin] = useState("");
  const [sesionAdmin, setSesionAdmin] = useState(false);
  const [administrador, setAdministrador] = useState(null);

  const [pantalla, setPantalla] = useState("inicio");
  const [colegios, setColegios] = useState([]);
  const [colegioSeleccionado, setColegioSeleccionado] = useState(null);
  const [errorColegios, setErrorColegios] = useState("");

  // =========================
  // INICIAR SESIÓN
  // =========================
  const iniciarSesionAdmin = async (e) => {
    e.preventDefault();

    setErrorAdmin("");

    try {
      const usuarioIngresado = usuario.trim();

      console.log("USUARIO ESCRITO:", usuarioIngresado);

      // Buscar administrador
      const { data, error } = await supabase
        .from("administradores")
        .select("id, nombre, usuario, rol, activo, email")
        .eq("usuario", usuarioIngresado)
        .limit(1);

      console.log("ADMINISTRADOR ENCONTRADO:", data);
      console.log("ERROR ADMINISTRADOR:", error);

      if (error) {
        console.error("ERROR SUPABASE ADMIN:", error);
        setErrorAdmin("Error al consultar el administrador");
        return;
      }

      if (!data || data.length === 0) {
        setErrorAdmin("Administrador no encontrado");
        return;
      }

      const administradorEncontrado = data[0];

      // Verificar que esté activo
      if (!administradorEncontrado.activo) {
        setErrorAdmin("El administrador está desactivado");
        return;
      }

      // Verificar que tenga correo
      if (!administradorEncontrado.email) {
        setErrorAdmin("El administrador no tiene correo registrado");
        return;
      }

      // Iniciar sesión con Supabase Auth
      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: administradorEncontrado.email,
          password: password,
        });

      console.log("ERROR AUTH:", authError);

      if (authError) {
        console.error("ERROR AL INICIAR AUTH:", authError);
        setErrorAdmin("Contraseña incorrecta");
        return;
      }

      // Sesión correcta
      setAdministrador(administradorEncontrado);
      setSesionAdmin(true);
      setPantalla("inicio");

    } catch (error) {
      console.error("ERROR GENERAL ADMIN:", error);
      setErrorAdmin("Ocurrió un error al iniciar sesión");
    }
  };

  // =========================
  // CARGAR COLEGIOS
  // =========================
  const cargarColegios = async () => {
    setErrorColegios("");

    const { data, error } = await supabase
      .from("colegios")
      .select("*")
      .order("nombre", { ascending: true });

    console.log("COLEGIOS ADMIN:", data);
    console.log("ERROR COLEGIOS ADMIN:", error);

    if (error) {
      setErrorColegios("No se pudieron cargar los colegios");
      return;
    }

    setColegios(data || []);
  };

  useEffect(() => {
    if (sesionAdmin && pantalla === "colegios") {
      cargarColegios();
    }
  }, [sesionAdmin, pantalla]);

  // =========================
  // IR A ELECCIONES
  // =========================
  const irAElecciones = () => {
    setPantalla("colegios");
  };

  // =========================
  // SELECCIONAR COLEGIO
  // =========================
  const seleccionarColegio = (colegio) => {
    setColegioSeleccionado(colegio);
    setPantalla("menuColegio");
  };

  // =========================
  // CERRAR SESIÓN
  // =========================
  const salir = async () => {
    await supabase.auth.signOut();

    setSesionAdmin(false);
    setAdministrador(null);
    setUsuario("");
    setPassword("");
    setErrorAdmin("");
    setPantalla("inicio");
    setColegios([]);
    setColegioSeleccionado(null);

    if (cerrarSesionAdmin) {
      cerrarSesionAdmin();
    }
  };

  // =========================
  // LOGIN
  // =========================
  if (!sesionAdmin) {
    return (
      <div className="admin-container">
        <div className="admin-login">

          <div className="admin-icon">🔐</div>

          <h1>Panel de Administración</h1>

          <p className="admin-subtitle">
            Acceso exclusivo para administradores
          </p>

          <form onSubmit={iniciarSesionAdmin}>

            <label>Usuario</label>

            <input
              type="text"
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              placeholder="Ingrese su usuario"
              required
            />

            <label>Contraseña</label>

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              required
            />

            {errorAdmin && (
              <div className="admin-error">
                {errorAdmin}
              </div>
            )}

            <button
              type="submit"
              className="admin-btn-primary"
            >
              INGRESAR
            </button>

          </form>

          <button
            className="admin-btn-back"
            onClick={volverAElecciones}
          >
            ← VOLVER
          </button>

        </div>
      </div>
    );
  }

  // =========================
  // LISTA DE COLEGIOS
  // =========================
  if (pantalla === "colegios") {
    return (
      <div className="admin-container">
        <div className="admin-panel">

          <h1>Gestionar colegios</h1>

          <p className="admin-welcome">
            Selecciona el colegio que deseas administrar.
          </p>

          {errorColegios && (
            <div className="admin-error">
              {errorColegios}
            </div>
          )}

          {colegios.length === 0 && !errorColegios && (
            <p>Cargando colegios...</p>
          )}

          <div className="admin-actions">

            {colegios.map((colegio) => (
              <button
                key={colegio.id}
                className="admin-btn-primary"
                onClick={() => seleccionarColegio(colegio)}
              >
                {colegio.nombre}
              </button>
            ))}

          </div>

          <button
            className="admin-btn-back"
            onClick={() => setPantalla("inicio")}
          >
            ← VOLVER
          </button>

        </div>
      </div>
    );
  }

  // =========================
  // MENÚ DEL COLEGIO
  // =========================
  if (pantalla === "menuColegio") {
    return (
      <div className="admin-container">
        <div className="admin-panel">

          <div className="admin-icon">🏫</div>

          <h1>{colegioSeleccionado?.nombre}</h1>

          <p className="admin-welcome">
            Panel de administración del colegio
          </p>

          <div className="admin-actions">

            <button className="admin-btn-primary">
              VER ESTUDIANTES
            </button>

            <button className="admin-btn-primary">
              VER LISTAS Y CANDIDATOS
            </button>

            <button className="admin-btn-primary">
              VER RESULTADOS
            </button>

            <button className="admin-btn-primary">
              CONFIGURAR ELECCIÓN
            </button>

          </div>

          <button
            className="admin-btn-back"
            onClick={() => setPantalla("colegios")}
          >
            ← CAMBIAR COLEGIO
          </button>

          <button
            className="admin-btn-danger"
            onClick={salir}
          >
            CERRAR SESIÓN
          </button>

        </div>
      </div>
    );
  }

  // =========================
  // PANEL PRINCIPAL
  // =========================
  return (
    <div className="admin-container">
      <div className="admin-panel">

        <div className="admin-icon">🔐</div>

        <h1>Administración</h1>

        <p className="admin-welcome">
          Bienvenido,{" "}
          <strong>{administrador?.nombre}</strong>
        </p>

        <div className="admin-info">

          <p>
            <strong>Usuario:</strong>{" "}
            {administrador?.usuario}
          </p>

          <p>
            <strong>Rol:</strong>{" "}
            {administrador?.rol}
          </p>

        </div>

        <div className="admin-actions">

          <button
            className="admin-btn-primary"
            onClick={irAElecciones}
          >
            IR A ELECCIONES
          </button>

          <button
            className="admin-btn-danger"
            onClick={salir}
          >
            CERRAR SESIÓN
          </button>

        </div>

      </div>
    </div>
  );
}

export default Admin;