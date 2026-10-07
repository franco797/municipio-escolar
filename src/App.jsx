import { useState, useEffect } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

function App() {
  const [sesionAdmin, setSesionAdmin] = useState(null);
  const [modoAdmin, setModoAdmin] = useState(false);

  const [usuarioAdmin, setUsuarioAdmin] = useState("");
  const [passwordAdmin, setPasswordAdmin] = useState("");
  const [errorAdmin, setErrorAdmin] = useState("");

  const [dni, setDni] = useState("");
  const [estudiante, setEstudiante] = useState(null);
  const [error, setError] = useState("");

  const [pantalla, setPantalla] = useState("inicio");
  const [listaSeleccionada, setListaSeleccionada] = useState(null);
  const [listas, setListas] = useState([]);

  const [colegios, setColegios] = useState([]);
  const [colegioSeleccionado, setColegioSeleccionado] = useState(null);

  useEffect(() => {
    cargarColegios();
  }, []);

  const cargarColegios = async () => {
    setError("");

    const { data, error } = await supabase
      .from("colegios")
      .select("*")
      .order("nombre", { ascending: true });

    console.log("COLEGIOS CARGADOS:", data);
    console.log("ERROR COLEGIOS:", error);

    if (error) {
      console.error("Error al cargar colegios:", error);
      setError("No se pudieron cargar los colegios.");
      return;
    }

    setColegios(data || []);
  };

  const iniciarSesionAdmin = async () => {
    setErrorAdmin("");

    if (!usuarioAdmin || !passwordAdmin) {
      setErrorAdmin("Ingresa tu usuario y contraseña.");
      return;
    }

    const { data: administrador, error: errorBD } = await supabase
      .from("administradores")
      .select("*")
      .eq("usuario", usuarioAdmin)
      .eq("activo", true)
      .maybeSingle();

    if (errorBD) {
      console.error("Error administradores:", errorBD);
      setErrorAdmin("No se pudo verificar el administrador.");
      return;
    }

    if (!administrador) {
      setErrorAdmin("Administrador no encontrado.");
      return;
    }

    const { error: errorAuth } =
      await supabase.auth.signInWithPassword({
        email: administrador.email,
        password: passwordAdmin,
      });

    if (errorAuth) {
      console.error("Error Auth:", errorAuth);
      setErrorAdmin("Usuario o contraseña incorrectos.");
      return;
    }

    setSesionAdmin(administrador);
    setModoAdmin(true);
    setErrorAdmin("");
  };

  const cerrarSesionAdmin = async () => {
    await supabase.auth.signOut();

    setSesionAdmin(null);
    setModoAdmin(false);
    setUsuarioAdmin("");
    setPasswordAdmin("");
    setErrorAdmin("");
  };

  const seleccionarColegio = (colegio) => {
    if (colegioSeleccionado?.id === colegio.id) {
      setColegioSeleccionado(null);
    } else {
      setColegioSeleccionado(colegio);
    }

    setError("");
  };

  const buscarEstudiante = async () => {
    setError("");

    if (!colegioSeleccionado) {
      setError("Primero selecciona tu colegio.");
      return;
    }

    if (dni.length !== 8) {
      setError("Ingresa un DNI válido de 8 dígitos.");
      return;
    }

    const { data, error } = await supabase
      .from("estudiantes")
      .select("*")
      .eq("dni", dni)
      .eq("colegio_id", colegioSeleccionado.id);

    if (error) {
      console.error("Error Supabase:", error);
      setError("Error al consultar los datos.");
      return;
    }

    if (!data || data.length === 0) {
      setError("DNI no encontrado en este colegio.");
      return;
    }

    const estudianteEncontrado = data[0];

    if (!estudianteEncontrado.habilitado) {
      setError("Este estudiante no está habilitado para votar.");
      return;
    }

    if (estudianteEncontrado.ya_voto) {
      setError("Este estudiante ya realizó su voto.");
      return;
    }

    setEstudiante(estudianteEncontrado);
    setPantalla("carnet");
  };

  const cargarListas = async () => {
    setError("");

    if (!colegioSeleccionado) {
      setError("No se ha seleccionado un colegio.");
      return false;
    }

    const { data, error } = await supabase
      .from("listas")
      .select("*")
      .eq("colegio_id", colegioSeleccionado.id)
      .order("id", { ascending: true });

    if (error) {
      console.error("Error al cargar listas:", error);
      setError("No se pudieron cargar las listas.");
      return false;
    }

    setListas(data || []);
    return true;
  };

  const irAVotar = async () => {
    setListaSeleccionada(null);

    const cargadas = await cargarListas();

    if (!cargadas) {
      return;
    }

    setPantalla("votacion");
  };

  const confirmarVoto = () => {
    if (!listaSeleccionada) {
      setError("Primero selecciona una lista.");
      return;
    }

    setError("");
    setPantalla("confirmacion");
  };

  const registrarVoto = async () => {
    if (!listaSeleccionada) {
      setError("No has seleccionado una lista.");
      return;
    }

    if (!estudiante) {
      setError("No se encontró el estudiante.");
      return;
    }

    if (!colegioSeleccionado) {
      setError("No se encontró el colegio.");
      return;
    }

    setError("");

    const { error: errorVoto } = await supabase
      .from("votos")
      .insert([
        {
          lista_id: listaSeleccionada,
          colegio_id: colegioSeleccionado.id,
        },
      ]);

    if (errorVoto) {
      console.error("Error al registrar voto:", errorVoto);
      setError("No se pudo registrar el voto.");
      return;
    }

    const { error: errorEstudiante } = await supabase
      .from("estudiantes")
      .update({ ya_voto: true })
      .eq("id", estudiante.id);

    if (errorEstudiante) {
      console.error(
        "Error al actualizar estudiante:",
        errorEstudiante
      );

      setError(
        "El voto se registró, pero no se pudo actualizar el estado del estudiante."
      );

      return;
    }

    setPantalla("finalizado");
  };

  const listaActual = listas.find(
    (lista) => lista.id === listaSeleccionada
  );

  return (
    <div className="app">

      <header className="encabezado">

        <div className="logo-municipio">

          <div className="logo-icono">
            🗳️
          </div>

          <div>
            <span className="logo-superior">
              MUNICIPIO ESCOLAR
            </span>

            <span className="logo-institucional">
              ELECCIONES ESCOLARES
            </span>
          </div>

        </div>

        {!modoAdmin && (
          <button
            className="btn-admin"
            onClick={() => {
              setModoAdmin(true);
              setErrorAdmin("");
            }}
          >
            🔐 Administración
          </button>
        )}

      </header>

      {modoAdmin && !sesionAdmin ? (

        <main className="contenido-principal">

          <div className="card card-inicio">

            <div className="icono-principal">
              🔐
            </div>

            <span className="etiqueta">
              ACCESO ADMINISTRATIVO
            </span>

            <h1>
              Panel de Administración
            </h1>

            <p className="subtitulo">
              Ingresa tus credenciales para continuar.
            </p>

            <div className="campo">

              <label>
                Usuario
              </label>

              <input
                type="text"
                placeholder="Ingresa tu usuario"
                value={usuarioAdmin}
                onChange={(e) => {
                  setUsuarioAdmin(e.target.value);
                  setErrorAdmin("");
                }}
              />

            </div>

            <div className="campo">

              <label>
                Contraseña
              </label>

              <input
                type="password"
                placeholder="Ingresa tu contraseña"
                value={passwordAdmin}
                onChange={(e) => {
                  setPasswordAdmin(e.target.value);
                  setErrorAdmin("");
                }}
              />

            </div>

            <button
              className="btn-principal"
              onClick={iniciarSesionAdmin}
            >
              INGRESAR
              <span>→</span>
            </button>

            {errorAdmin && (
              <p className="error">
                {errorAdmin}
              </p>
            )}

            <button
              className="btn-secundario"
              onClick={() => {
                setModoAdmin(false);
                setErrorAdmin("");
                setUsuarioAdmin("");
                setPasswordAdmin("");
              }}
            >
              ← VOLVER
            </button>

          </div>

        </main>

      ) : sesionAdmin ? (

        <main className="contenido-principal">

          <div className="card card-inicio">

            <div className="icono-principal">
              👨‍💼
            </div>

            <span className="etiqueta">
              ADMINISTRACIÓN
            </span>

            <h1>
              Bienvenido
            </h1>

            <p className="subtitulo">
              {sesionAdmin.nombre || sesionAdmin.usuario}
            </p>

            <div className="datos">

              <div className="dato">
                <span>
                  USUARIO
                </span>

                <strong>
                  {sesionAdmin.usuario}
                </strong>
              </div>

              <div className="dato">
                <span>
                  ROL
                </span>

                <strong>
                  {sesionAdmin.rol || "Administrador"}
                </strong>
              </div>

            </div>

            <button
              className="btn-principal"
              onClick={() => {
                setModoAdmin(false);
              }}
            >
              IR A ELECCIONES
              <span>→</span>
            </button>

            <button
              className="btn-secundario"
              onClick={cerrarSesionAdmin}
            >
              CERRAR SESIÓN
            </button>

          </div>

        </main>

      ) : (

        <main className="contenido-principal">

          {pantalla === "inicio" && (

            <div className="card card-inicio">

              <div className="icono-principal">
                🏫
              </div>

              <span className="etiqueta">
                ELECCIONES DEL MUNICIPIO ESCOLAR
              </span>

              <h1>
                Selecciona tu
                <br />
                colegio
              </h1>

              <p className="subtitulo">
                Selecciona el colegio donde participarás
                en las elecciones.
              </p>

              <div className="colegios">

                {colegios.map((colegio) => (

                  <div
                    key={colegio.id}
                    className={`colegio-card ${
                      colegioSeleccionado?.id === colegio.id
                        ? "seleccionado"
                        : ""
                    }`}
                    onClick={() =>
                      seleccionarColegio(colegio)
                    }
                  >

                    <div className="colegio-insignia">

                      {colegio.insignia_url ? (

                        <img
                          src={colegio.insignia_url}
                          alt={`Insignia de ${colegio.nombre}`}
                        />

                      ) : (

                        <span>
                          🏫
                        </span>

                      )}

                    </div>

                    <div className="colegio-info">

                      <span>
                        COLEGIO
                      </span>

                      <h2>
                        {colegio.nombre}
                      </h2>

                      <p>
                        Elecciones del Municipio Escolar
                      </p>

                    </div>

                    <div className="colegio-check">

                      {colegioSeleccionado?.id === colegio.id
                        ? "✓"
                        : "›"}

                    </div>

                  </div>

                ))}

              </div>

              {colegios.length === 0 && (
                <p className="sin-listas">
                  No hay colegios registrados.
                </p>
              )}

              <button
                className="btn-principal"
                disabled={!colegioSeleccionado}
                onClick={() => {
                  setError("");
                  setPantalla("dni");
                }}
              >
                CONTINUAR
                <span>→</span>
              </button>

              {error && (
                <p className="error">
                  {error}
                </p>
              )}

              <div className="seguridad">
                🔒 Tu participación será registrada de manera segura
              </div>

            </div>

          )}

          {pantalla === "dni" && colegioSeleccionado && (

            <div className="card card-inicio">

              <div className="colegio-mini">

                <div className="colegio-insignia mini">

                  {colegioSeleccionado.insignia_url ? (

                    <img
                      src={colegioSeleccionado.insignia_url}
                      alt="Insignia"
                    />

                  ) : (

                    <span>
                      🏫
                    </span>

                  )}

                </div>

                <div>

                  <span>
                    COLEGIO
                  </span>

                  <strong>
                    {colegioSeleccionado.nombre}
                  </strong>

                </div>

              </div>

              <div className="icono-principal">
                🔐
              </div>

              <span className="etiqueta">
                IDENTIFICACIÓN DEL ELECTOR
              </span>

              <h1>
                Ingresa tu DNI
              </h1>

              <p className="subtitulo">
                Verificaremos tu identidad para que puedas
                participar en las elecciones.
              </p>

              <div className="separador"></div>

              <div className="campo">

                <label htmlFor="dni">
                  Número de DNI
                </label>

                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  maxLength="8"
                  placeholder="Ingresa tu DNI"
                  value={dni}
                  onChange={(e) => {
                    setDni(
                      e.target.value.replace(/\D/g, "")
                    );
                    setError("");
                  }}
                />

              </div>

              <button
                className="btn-principal"
                onClick={buscarEstudiante}
              >
                CONTINUAR
                <span>→</span>
              </button>

              {error && (
                <p className="error">
                  {error}
                </p>
              )}

              <div className="seguridad">
                🔒 Tu participación es registrada de manera segura
              </div>

            </div>

          )}

          {pantalla === "carnet" && estudiante && (

            <div className="card carnet">

              <div className="icono-principal">
                🪪
              </div>

              <span className="etiqueta">
                IDENTIFICACIÓN ELECTORAL
              </span>

              <h1>
                Carnet Electoral
              </h1>

              <p className="subtitulo">
                Verifica que tus datos sean correctos.
              </p>

              <div className="datos">

                <div className="dato">
                  <span>
                    Nombres
                  </span>

                  <strong>
                    {estudiante.nombres}
                  </strong>
                </div>

                <div className="dato">
                  <span>
                    Apellidos
                  </span>

                  <strong>
                    {estudiante.apellidos}
                  </strong>
                </div>

                <div className="dato">
                  <span>
                    Grado
                  </span>

                  <strong>
                    {estudiante.grado}
                  </strong>
                </div>

                <div className="dato">
                  <span>
                    Sección
                  </span>

                  <strong>
                    {estudiante.seccion}
                  </strong>
                </div>

              </div>

              <div className="habilitado">
                <span>
                  ✓
                </span>

                ESTUDIANTE HABILITADO PARA VOTAR
              </div>

              <button
                className="btn-principal"
                onClick={irAVotar}
              >
                INGRESAR A VOTAR
                <span>→</span>
              </button>

              {error && (
                <p className="error">
                  {error}
                </p>
              )}

            </div>

          )}

          {pantalla === "votacion" && (

            <div className="card votacion">

              <div className="icono-principal">
                🗳️
              </div>

              <span className="etiqueta">
                CÉDULA ELECTORAL
              </span>

              <h1>
                Selecciona tu lista
              </h1>

              <p className="subtitulo">
                Selecciona una sola opción para continuar.
              </p>

              <div className="listas">

                {listas.map((lista) => (

                  <div
                    key={lista.id}
                    className={`lista ${
                      listaSeleccionada === lista.id
                        ? "seleccionada"
                        : ""
                    }`}
                    onClick={() => {
                      setListaSeleccionada(lista.id);
                      setError("");
                    }}
                    style={{
                      borderLeft:
                        `7px solid ${
                          lista.color || "#1565c0"
                        }`,
                    }}
                  >

                    <input
                      type="radio"
                      name="lista"
                      checked={
                        listaSeleccionada === lista.id
                      }
                      onChange={() =>
                        setListaSeleccionada(lista.id)
                      }
                    />

                    <div className="lista-contenido">

                      <span className="numero-lista">
                        LISTA {lista.id}
                      </span>

                      <h2>
                        {lista.nombre}
                      </h2>

                      <p>
                        Candidato:{" "}
                        <strong>
                          {lista.candidato}
                        </strong>
                      </p>

                    </div>

                    {listaSeleccionada === lista.id && (
                      <div className="check-lista">
                        ✓
                      </div>
                    )}

                  </div>

                ))}

              </div>

              {listas.length === 0 && (
                <p className="sin-listas">
                  No hay listas disponibles para este colegio.
                </p>
              )}

              <button
                className="btn-principal"
                onClick={confirmarVoto}
              >
                CONTINUAR
                <span>→</span>
              </button>

              {error && (
                <p className="error">
                  {error}
                </p>
              )}

            </div>

          )}

          {pantalla === "confirmacion" && (

            <div className="card confirmacion">

              <div className="icono-confirmacion">
                ⚠️
              </div>

              <span className="etiqueta">
                CONFIRMACIÓN
              </span>

              <h1>
                Confirma tu voto
              </h1>

              <p className="subtitulo">
                Revisa tu elección antes de registrar el voto.
              </p>

              <div className="seleccion-final">

                <span>
                  Has seleccionado
                </span>

                <strong>
                  LISTA {listaActual?.id}
                </strong>

                <p>
                  {listaActual?.nombre}
                </p>

                <small>
                  Candidato: {listaActual?.candidato}
                </small>

              </div>

              <p className="pregunta">
                ¿Estás seguro de tu elección?
              </p>

              <div className="botones">

                <button
                  className="btn-secundario"
                  onClick={() =>
                    setPantalla("votacion")
                  }
                >
                  ← CAMBIAR
                </button>

                <button
                  className="btn-principal"
                  onClick={registrarVoto}
                >
                  CONFIRMAR VOTO
                </button>

              </div>

              {error && (
                <p className="error">
                  {error}
                </p>
              )}

            </div>

          )}

          {pantalla === "finalizado" && (

            <div className="card finalizado">

              <div className="icono-exito">
                ✓
              </div>

              <span className="etiqueta">
                PROCESO COMPLETADO
              </span>

              <h1>
                ¡Voto registrado!
              </h1>

              <p className="subtitulo">
                Tu participación ha sido registrada correctamente.
              </p>

              <div className="aviso-final">

                <strong>
                  Gracias por participar.
                </strong>

                <span>
                  Tu voto ha sido registrado de manera segura
                  en las Elecciones del Municipio Escolar.
                </span>

              </div>

            </div>

          )}

        </main>

      )}

      <footer className="pie">

        <span>
          Elecciones del Municipio Escolar
        </span>

        <span className="punto">
          •
        </span>

        <span>
          Participación estudiantil
        </span>

      </footer>

    </div>
  );
}

export default App;