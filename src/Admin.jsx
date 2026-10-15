import { useState, useEffect } from "react";
import "./Admin.css";
import Estudiantes from "./Estudiantes";
import ConfiguracionEleccion from "./ConfiguracionEleccion";
import ListasCandidatos from "./ListasCandidatos";
import Resultados from "./Resultados";

function Admin({ supabase, cerrarSesionAdmin, volverAElecciones }) {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");
  const [errorAdmin, setErrorAdmin] = useState("");
  const [cargandoLogin, setCargandoLogin] = useState(false);
  const [sesionAdmin, setSesionAdmin] = useState(false);
  const [administrador, setAdministrador] = useState(null);

  const [pantalla, setPantalla] = useState("inicio");
  const [colegios, setColegios] = useState([]);
  const [colegioSeleccionado, setColegioSeleccionado] = useState(null);
  const [errorColegios, setErrorColegios] = useState("");

  const iniciarSesionAdmin = async (e) => {
    e.preventDefault();
    setErrorAdmin("");

    const usuarioIngresado = usuario.trim();

    if (!usuarioIngresado || !password) {
      setErrorAdmin("Ingresa tu usuario y contraseña.");
      return;
    }

    setCargandoLogin(true);

    try {
      const { data, error } = await supabase
        .from("administradores")
        .select("*")
        .ilike("usuario", usuarioIngresado)
        .maybeSingle();

      if (error) {
        console.error("ERROR AL BUSCAR ADMINISTRADOR:", error);
        setErrorAdmin("No se pudo consultar el administrador.");
        return;
      }

      if (!data) {
        setErrorAdmin("Administrador no encontrado. Verifica el usuario.");
        return;
      }

      if (!data.activo) {
        setErrorAdmin("El administrador está desactivado.");
        return;
      }

      if (!data.email) {
        setErrorAdmin("El administrador no tiene correo registrado.");
        return;
      }

      const { error: authError } =
        await supabase.auth.signInWithPassword({
          email: data.email.trim(),
          password,
        });

      if (authError) {
        console.error("ERROR DE AUTENTICACIÓN:", authError);
        setErrorAdmin(
          "No se pudo iniciar sesión. Verifica la contraseña y la cuenta de Supabase Authentication."
        );
        return;
      }

      setAdministrador(data);
      setSesionAdmin(true);
      setPantalla("inicio");
    } catch (error) {
      console.error("ERROR GENERAL ADMIN:", error);
      setErrorAdmin("Ocurrió un error al iniciar sesión.");
    } finally {
      setCargandoLogin(false);
    }
  };

  const cargarColegios = async () => {
    setErrorColegios("");

    const { data, error } = await supabase
      .from("colegios")
      .select("*")
      .order("nombre", { ascending: true });

    if (error) {
      console.error("ERROR AL CARGAR COLEGIOS:", error);
      setErrorColegios("No se pudieron cargar los colegios.");
      return;
    }

    setColegios(data || []);
  };

  useEffect(() => {
    if (sesionAdmin && pantalla === "colegios") {
      cargarColegios();
    }
  }, [sesionAdmin, pantalla]);

  const irAElecciones = () => {
    setPantalla("colegios");
  };

  const seleccionarColegio = (colegio) => {
    setColegioSeleccionado(colegio);
    setPantalla("menuColegio");
  };

  const salir = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        console.error("ERROR AL CERRAR SESIÓN:", error);
      }
    } finally {
      setSesionAdmin(false);
      setAdministrador(null);
      setUsuario("");
      setPassword("");
      setErrorAdmin("");
      setCargandoLogin(false);
      setPantalla("inicio");
      setColegios([]);
      setColegioSeleccionado(null);

      if (cerrarSesionAdmin) {
        cerrarSesionAdmin();
      }
    }
  };

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
              autoComplete="username"
              required
            />

            <label>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingrese su contraseña"
              autoComplete="current-password"
              required
            />

            {errorAdmin && (
              <div className="admin-error" role="alert">
                {errorAdmin}
              </div>
            )}

            <button
              type="submit"
              className="admin-btn-primary"
              disabled={cargandoLogin}
            >
              {cargandoLogin ? "VERIFICANDO..." : "INGRESAR"}
            </button>
          </form>

          <button
            type="button"
            className="admin-btn-back"
            onClick={volverAElecciones}
            disabled={cargandoLogin}
          >
            ← VOLVER
          </button>
        </div>
      </div>
    );
  }

  if (pantalla === "colegios") {
    return (
      <div className="admin-container">
        <div className="admin-panel">
          <h1>Gestionar colegios</h1>
          <p className="admin-welcome">
            Selecciona el colegio que deseas administrar.
          </p>

          {errorColegios && (
            <div className="admin-error">{errorColegios}</div>
          )}

          {!errorColegios && colegios.length === 0 && (
            <p>No hay colegios disponibles.</p>
          )}

          <div className="admin-actions">
            {colegios.map((colegio) => (
              <button
                type="button"
                key={colegio.id}
                className="admin-btn-primary"
                onClick={() => seleccionarColegio(colegio)}
              >
                {colegio.nombre}
              </button>
            ))}
          </div>

          <button
            type="button"
            className="admin-btn-back"
            onClick={() => setPantalla("inicio")}
          >
            ← VOLVER
          </button>
        </div>
      </div>
    );
  }

  if (pantalla === "estudiantes") {
    return (
      <Estudiantes
        supabase={supabase}
        colegio={colegioSeleccionado}
        volver={() => setPantalla("menuColegio")}
      />
    );
  }

  if (pantalla === "listas") {
    return (
      <ListasCandidatos
        supabase={supabase}
        colegio={colegioSeleccionado}
        volver={() => setPantalla("menuColegio")}
      />
    );
  }

  if (pantalla === "configuracion") {
    return (
      <ConfiguracionEleccion
        supabase={supabase}
        colegio={colegioSeleccionado}
        volver={() => setPantalla("menuColegio")}
      />
    );
  }

  if (pantalla === "resultados") {
  return (
    <Resultados
      supabase={supabase}
      colegio={colegioSeleccionado}
      volver={() => setPantalla("menuColegio")}
    />
  );
}

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
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => setPantalla("estudiantes")}
            >
              VER ESTUDIANTES
            </button>

            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => setPantalla("listas")}
            >
              VER LISTAS Y CANDIDATOS
            </button>

            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => setPantalla("resultados")}
            >
              VER RESULTADOS
            </button>

            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => setPantalla("configuracion")}
            >
              CONFIGURAR ELECCIÓN
            </button>
          </div>

          <button
            type="button"
            className="admin-btn-back"
            onClick={() => setPantalla("colegios")}
          >
            ← CAMBIAR COLEGIO
          </button>

          <button
            type="button"
            className="admin-btn-danger"
            onClick={salir}
          >
            CERRAR SESIÓN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-panel">
        <div className="admin-icon">🔐</div>
        <h1>Administración</h1>

        <p className="admin-welcome">
          Bienvenido, <strong>{administrador?.nombre}</strong>
        </p>

        <div className="admin-info">
          <p>
            <strong>Usuario:</strong> {administrador?.usuario}
          </p>
          <p>
            <strong>Rol:</strong> {administrador?.rol}
          </p>
        </div>

        <div className="admin-actions">
          <button
            type="button"
            className="admin-btn-primary"
            onClick={irAElecciones}
          >
            IR A ELECCIONES
          </button>

          <button
            type="button"
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