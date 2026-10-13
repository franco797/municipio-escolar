import { useState, useEffect } from "react";
import "./App.css";
import Admin from "./Admin";
import { supabase } from "./supabaseClient";

function App() {
  const [sesionAdmin, setSesionAdmin] = useState(null);
  const [modoAdmin, setModoAdmin] = useState(false);

  const [dni, setDni] = useState("");
  const [estudiante, setEstudiante] = useState(null);
  const [error, setError] = useState("");

  const [pantalla, setPantalla] = useState("inicio");
  const [listaSeleccionada, setListaSeleccionada] = useState(null);
  const [listas, setListas] = useState([]);

  const [colegios, setColegios] = useState([]);
  const [errorColegios, setErrorColegios] = useState("");
  const [cargandoColegios, setCargandoColegios] = useState(true);
  const [colegioSeleccionado, setColegioSeleccionado] = useState(null);
  const [registrandoVoto, setRegistrandoVoto] = useState(false);

  useEffect(() => {
    const cargarColegios = async () => {
      setCargandoColegios(true);
      setErrorColegios("");

      const { data, error } = await supabase
        .from("colegios")
        .select("*")
        .order("nombre", { ascending: true });

      if (error) {
        console.error("ERROR AL CARGAR COLEGIOS:", error);
        setErrorColegios("No se pudieron cargar los colegios.");
        setColegios([]);
      } else {
        setColegios(data || []);
      }

      setCargandoColegios(false);
    };

    cargarColegios();
  }, []);

  const cerrarSesionAdmin = async () => {
    await supabase.auth.signOut();

    setSesionAdmin(null);
    setModoAdmin(false);
  };

  const seleccionarColegio = (colegio) => {
    setColegioSeleccionado(colegio);
    setError("");
  };

  const buscarEstudiante = async () => {
    setError("");

    if (!colegioSeleccionado) {
      setError("Primero selecciona tu colegio.");
      return;
    }

    if (!/^\d{8}$/.test(dni)) {
      setError("Ingresa un DNI válido de 8 dígitos.");
      return;
    }

    const { data, error } = await supabase
      .from("estudiantes")
      .select("*")
      .eq("dni", dni)
      .eq("colegio_id", colegioSeleccionado.id)
      .maybeSingle();

    if (error) {
      console.error("ERROR AL CONSULTAR ESTUDIANTE:", error);
      setError("Error al consultar los datos.");
      return;
    }

    if (!data) {
      setError("DNI no encontrado en este colegio.");
      return;
    }

    if (!data.habilitado) {
      setError("Este estudiante no está habilitado para votar.");
      return;
    }

    if (data.ya_voto) {
      setError("Este estudiante ya realizó su voto.");
      return;
    }

    setEstudiante(data);
    setPantalla("carnet");
  };

 
const cargarListas = async () => {
  setError("");

  if (!colegioSeleccionado) {
    setError("No se ha seleccionado un colegio.");
    return false;
  }

  const { data: listasData, error: errorListas } = await supabase
    .from("listas")
    .select("*")
    .eq("colegio_id", colegioSeleccionado.id)
    .order("id", { ascending: true });

  if (errorListas) {
    console.error("ERROR AL CARGAR LISTAS:", errorListas);
    setError("No se pudieron cargar las listas.");
    return false;
  }

  const listasBase = listasData || [];

  if (listasBase.length === 0) {
    setListas([]);
    return true;
  }

  const idsListas = listasBase.map((lista) => lista.id);

  const { data: candidatosData, error: errorCandidatos } =
    await supabase
      .from("candidatos")
      .select("lista_id, nombres, apellidos, cargo, foto_url")
      .in("lista_id", idsListas);

  if (errorCandidatos) {
    console.error("ERROR AL CARGAR CANDIDATOS:", errorCandidatos);
    setError("No se pudieron cargar las fotos de los candidatos.");
    return false;
  }

  const candidatos = candidatosData || [];

  const listasCompletas = listasBase.map((lista) => {
    const alcalde = candidatos.find(
      (candidato) =>
        String(candidato.lista_id) === String(lista.id) &&
        (candidato.cargo || "").trim().toLowerCase() ===
          "alcalde escolar"
    );

    return {
      ...lista,
      foto_candidato:
        alcalde?.foto_url || lista.foto_candidato || "",
      candidato: alcalde
        ? `${alcalde.nombres || ""} ${alcalde.apellidos || ""}`.trim()
        : lista.candidato || "",
    };
  });

  setListas(listasCompletas);
  return true;
};


  const irAVotar = async () => {
    setListaSeleccionada(null);

    const cargadas = await cargarListas();

    if (cargadas) {
      setPantalla("votacion");
    }
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
    if (registrandoVoto) return;

    if (!listaSeleccionada || !estudiante || !colegioSeleccionado) {
      setError("Faltan datos para registrar el voto.");
      return;
    }

    setError("");
    setRegistrandoVoto(true);

    try {
      // Comprobar nuevamente que el estudiante no haya votado.
      const { data: estudianteActual, error: errorConsulta } =
        await supabase
          .from("estudiantes")
          .select("id, ya_voto, habilitado")
          .eq("id", estudiante.id)
          .eq("colegio_id", colegioSeleccionado.id)
          .maybeSingle();

      if (errorConsulta) {
        console.error("ERROR AL VERIFICAR VOTO:", errorConsulta);
        setError("No se pudo verificar el estado del estudiante.");
        return;
      }

      if (!estudianteActual) {
        setError("No se encontró al estudiante.");
        return;
      }

      if (!estudianteActual.habilitado) {
        setError("El estudiante no está habilitado para votar.");
        return;
      }

      if (estudianteActual.ya_voto) {
        setError("Este estudiante ya realizó su voto.");
        return;
      }

      // Registrar el voto con el estudiante y su colegio.
      const { error: errorVoto } = await supabase
        .from("votos")
        .insert([
          {
            estudiante_id: estudiante.id,
            lista_id: listaSeleccionada,
            colegio_id: colegioSeleccionado.id,
          },
        ]);

     
if (errorVoto) {
  console.error("ERROR AL REGISTRAR VOTO:", {
    mensaje: errorVoto.message,
    detalle: errorVoto.details,
    sugerencia: errorVoto.hint,
    codigo: errorVoto.code,
  });
  setError("No se pudo registrar el voto: " + errorVoto.message);
  return;
}


      // Marcar al estudiante como elector que ya votó.
      const { data: estudianteActualizado, error: errorActualizar } =
        await supabase
          .from("estudiantes")
          .update({ ya_voto: true })
          .eq("id", estudiante.id)
          .eq("ya_voto", false)
          .select("id");

      if (errorActualizar || !estudianteActualizado?.length) {
        console.error(
          "ERROR AL ACTUALIZAR ESTUDIANTE:",
          errorActualizar
        );

        setError(
          "El voto se registró, pero no se pudo confirmar el estado del estudiante. No vuelvas a enviar el voto; solicita una revisión."
        );
        return;
      }

      setEstudiante((anterior) => ({
        ...anterior,
        ya_voto: true,
      }));

      setPantalla("finalizado");
    } catch (error) {
      console.error("ERROR GENERAL AL REGISTRAR VOTO:", error);
      setError("Ocurrió un error al registrar el voto.");
    } finally {
      setRegistrandoVoto(false);
    }
  };

  const listaActual = listas.find(
    (lista) => String(lista.id) === String(listaSeleccionada)
  );

  return (
    <div className="app">
      <header className="encabezado">
        <div className="logo-municipio">
          <div className="logo-icono">🗳️</div>

          <div>
            <span className="logo-superior">MUNICIPIO ESCOLAR</span>
            <span className="logo-institucional">
              ELECCIONES ESCOLARES
            </span>
          </div>
        </div>

        {!modoAdmin && (
          <button
            type="button"
            className="btn-admin"
            onClick={() => setModoAdmin(true)}
            title="Administración"
            aria-label="Abrir administración"
          >
            🔐
          </button>
        )}
      </header>

      {modoAdmin && !sesionAdmin ? (
        <Admin
          supabase={supabase}
          cerrarSesionAdmin={cerrarSesionAdmin}
          volverAElecciones={() => {
            setModoAdmin(false);
          }}
        />
      ) : sesionAdmin ? (
        <main className="contenido-principal">
          <div className="card card-inicio">
            <div className="icono-principal">👨‍💼</div>

            <span className="etiqueta">ADMINISTRACIÓN</span>

            <h1>Bienvenido</h1>

            <p className="subtitulo">
              {sesionAdmin.nombre || sesionAdmin.usuario}
            </p>

            <div className="datos">
              <div className="dato">
                <span>USUARIO</span>
                <strong>{sesionAdmin.usuario}</strong>
              </div>

              <div className="dato">
                <span>ROL</span>
                <strong>{sesionAdmin.rol || "Administrador"}</strong>
              </div>
            </div>

            <button
              type="button"
              className="btn-principal"
              onClick={() => setModoAdmin(false)}
            >
              IR A ELECCIONES <span>→</span>
            </button>

            <button
              type="button"
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
              <div className="icono-principal">🏫</div>

              <span className="etiqueta">
                ELECCIONES DEL MUNICIPIO ESCOLAR
              </span>

              <h1>
                Selecciona tu
                <br />
                colegio
              </h1>

              <p className="subtitulo">
                Selecciona el colegio donde participarás en las elecciones.
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
                    onClick={() => seleccionarColegio(colegio)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        seleccionarColegio(colegio);
                      }
                    }}
                  >
                    <div className="colegio-insignia">
                      {colegio.insignia_url ? (
                        <img
                          src={colegio.insignia_url}
                          alt={`Insignia de ${colegio.nombre}`}
                        />
                      ) : (
                        <span>🏫</span>
                      )}
                    </div>

                    <div className="colegio-info">
                      <span>COLEGIO</span>
                      <h2>{colegio.nombre}</h2>
                      <p>Elecciones del Municipio Escolar</p>
                    </div>

                    <div className="colegio-check">
                      {colegioSeleccionado?.id === colegio.id ? "✓" : "›"}
                    </div>
                  </div>
                ))}
              </div>

              {cargandoColegios && (
                <p className="sin-listas">Cargando colegios...</p>
              )}

              {!cargandoColegios &&
                !errorColegios &&
                colegios.length === 0 && (
                  <p className="sin-listas">
                    No hay colegios registrados.
                  </p>
                )}

              {errorColegios && (
                <p className="error">{errorColegios}</p>
              )}

              <button
                type="button"
                className="btn-principal"
                disabled={!colegioSeleccionado || cargandoColegios}
                onClick={() => {
                  setError("");
                  setDni("");
                  setEstudiante(null);
                  setPantalla("dni");
                }}
              >
                CONTINUAR <span>→</span>
              </button>

              {error && <p className="error">{error}</p>}

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
                    <span>🏫</span>
                  )}
                </div>

                <div>
                  <span>COLEGIO</span>
                  <strong>{colegioSeleccionado.nombre}</strong>
                </div>
              </div>

              <div className="icono-principal">🔐</div>

              <span className="etiqueta">IDENTIFICACIÓN DEL ELECTOR</span>

              <h1>Ingresa tu DNI</h1>

              <p className="subtitulo">
                Verificaremos tu identidad para que puedas participar en las
                elecciones.
              </p>

              <div className="separador"></div>

              <div className="campo">
                <label htmlFor="dni">Número de DNI</label>

                <input
                  id="dni"
                  type="text"
                  inputMode="numeric"
                  maxLength={8}
                  placeholder="Ingresa tu DNI"
                  value={dni}
                  onChange={(e) => {
                    setDni(e.target.value.replace(/\D/g, ""));
                    setError("");
                  }}
                />
              </div>

              <button
                type="button"
                className="btn-principal"
                onClick={buscarEstudiante}
              >
                CONTINUAR <span>→</span>
              </button>

              {error && <p className="error">{error}</p>}

              <button
                type="button"
                className="btn-secundario"
                onClick={() => {
                  setPantalla("inicio");
                  setError("");
                }}
              >
                ← VOLVER
              </button>

              <div className="seguridad">
                🔒 Tu participación es registrada de manera segura
              </div>
            </div>
          )}

          {pantalla === "carnet" && estudiante && (
            <div className="card carnet">
              <div className="icono-principal">🪪</div>

              <span className="etiqueta">IDENTIFICACIÓN ELECTORAL</span>

              <h1>Carnet Electoral</h1>

              <p className="subtitulo">
                Verifica que tus datos sean correctos.
              </p>

              <div className="datos">
                <div className="dato">
                  <span>Nombres</span>
                  <strong>{estudiante.nombres}</strong>
                </div>

                <div className="dato">
                  <span>Apellidos</span>
                  <strong>{estudiante.apellidos}</strong>
                </div>

                <div className="dato">
                  <span>Grado</span>
                  <strong>{estudiante.grado}</strong>
                </div>

                <div className="dato">
                  <span>Sección</span>
                  <strong>{estudiante.seccion}</strong>
                </div>
              </div>

              <div className="habilitado">
                <span>✓</span> ESTUDIANTE HABILITADO PARA VOTAR
              </div>

              <button
                type="button"
                className="btn-principal"
                onClick={irAVotar}
              >
                INGRESAR A VOTAR <span>→</span>
              </button>

              {error && <p className="error">{error}</p>}

              <button
                type="button"
                className="btn-secundario"
                onClick={() => setPantalla("dni")}
              >
                ← VOLVER
              </button>
            </div>
          )}

          {pantalla === "votacion" && (
            <div className="card votacion">
              <div className="icono-principal">🗳️</div>

              <span className="etiqueta">CÉDULA ELECTORAL</span>

              <h1>Selecciona tu lista</h1>

              <p className="subtitulo">
                Selecciona una sola opción para continuar.
              </p>

              <div className="listas">
         {listas.map((lista) => (
  <div
    key={lista.id}
    className={`lista ${
      String(listaSeleccionada) === String(lista.id)
        ? "seleccionada"
        : ""
    }`}
    onClick={() => {
      setListaSeleccionada(lista.id);
      setError("");
    }}
    style={{
      borderLeft: `7px solid ${lista.color || "#1565c0"}`,
    }}
  >
   

    <span className="numero-lista">
      LISTA {lista.numero ?? lista.id}
    </span>

    <div className="cedula-contenido">
      <div className="cedula-columna">
        {lista.logo_url && (
          <img
            src={lista.logo_url}
            alt={`Logo de ${lista.nombre}`}
            className="cedula-logo"
          />
        )}

        <h2>{lista.nombre}</h2>
      </div>

      <div className="cedula-columna">
        {lista.foto_candidato && (
          <img
            src={lista.foto_candidato}
            alt={`Candidato ${lista.candidato}`}
            className="cedula-foto"
          />
        )}

        <p>
          <strong>{lista.candidato}</strong>
        </p>
      </div>
    </div>

    <label className="cedula-marcar">
      <input
        type="radio"
        name="lista"
        checked={
          String(listaSeleccionada) === String(lista.id)
        }
        onChange={() => {
          setListaSeleccionada(lista.id);
          setError("");
        }}
      />
      Marcar esta lista
    </label>

    {String(listaSeleccionada) === String(lista.id) && (
      <div className="check-lista">✓</div>
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
  type="button"
  className="btn-principal"
  onClick={confirmarVoto}
>
  CONTINUAR <span>→</span>
</button>

{error && <p className="error">{error}</p>}

<button
  type="button"
  className="btn-secundario"
  onClick={() => setPantalla("carnet")}
>
  ← VOLVER
</button>
</div>
)}

{pantalla === "confirmacion" && (
  <div className="card confirmacion">
    <div className="icono-confirmacion">⚠️</div>
    <span className="etiqueta">CONFIRMACIÓN</span>

    <h1>Confirma tu voto</h1>

    <p className="subtitulo">
      Revisa tu elección antes de registrar el voto.
    </p>

    <div className="seleccion-final">
      <span>Has seleccionado</span>
      <strong>
        LISTA {listaActual?.numero ?? listaActual?.id}
      </strong>
      <p>{listaActual?.nombre}</p>
      <small>Candidato: {listaActual?.candidato}</small>
    </div>

    <p className="pregunta">
      ¿Estás seguro de tu elección?
    </p>

    <div className="botones">
      <button
        type="button"
        className="btn-secundario"
        onClick={() => setPantalla("votacion")}
        disabled={registrandoVoto}
      >
        ← CAMBIAR
      </button>

      <button
        type="button"
        className="btn-principal"
        onClick={registrarVoto}
        disabled={registrandoVoto}
      >
        {registrandoVoto ? "REGISTRANDO..." : "CONFIRMAR VOTO"}
      </button>
    </div>

    {error && <p className="error">{error}</p>}
  </div>
)}

{pantalla === "finalizado" && (
  <div className="card finalizado">
    <div className="icono-exito">✓</div>

    <span className="etiqueta">PROCESO COMPLETADO</span>

    <h1>¡Voto registrado!</h1>

    <p className="subtitulo">
      Tu participación ha sido registrada correctamente.
    </p>

    <div className="aviso-final">
      <strong>Gracias por participar.</strong>
      <span>
        Tu voto ha sido registrado en las Elecciones del Municipio Escolar.
      </span>
    </div>
  </div>
)}
</main>
)}

<footer className="pie">
  <span>Elecciones del Municipio Escolar</span>
  <span className="punto">•</span>
  <span>Participación estudiantil</span>
</footer>
</div>
);
}

export default App;
 




