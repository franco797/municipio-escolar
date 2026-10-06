import { useState } from "react";
import "./App.css";
import { supabase } from "./supabaseClient";

function App() {
  const [dni, setDni] = useState("");
  const [estudiante, setEstudiante] = useState(null);
  const [error, setError] = useState("");
  const [pantalla, setPantalla] = useState("inicio");
  const [listaSeleccionada, setListaSeleccionada] = useState(null);
  const [listas, setListas] = useState([]);

  const buscarEstudiante = async () => {
    setError("");

    if (dni.length !== 8) {
      setError("Ingresa un DNI válido de 8 dígitos.");
      return;
    }

    const { data, error } = await supabase
      .from("estudiantes")
      .select("*")
      .eq("dni", dni);

    if (error) {
      console.error("Error Supabase:", error);
      setError("Error al consultar los datos.");
      return;
    }

    if (!data || data.length === 0) {
      setError("DNI no encontrado. Consulta con el encargado.");
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

    const { data, error } = await supabase
      .from("listas")
      .select("*")
      .order("numero", { ascending: true });

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

    setError("");

    // 1. Guardar el voto
    const { error: errorVoto } = await supabase
      .from("votos")
      .insert([
        {
          lista_id: listaSeleccionada,
        },
      ]);

    if (errorVoto) {
      console.error("Error al registrar voto:", errorVoto);
      setError("No se pudo registrar el voto.");
      return;
    }

    // 2. Marcar al estudiante como que ya votó
    const { error: errorEstudiante } = await supabase
      .from("estudiantes")
      .update({ ya_voto: true })
      .eq("dni", estudiante.dni);

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

    // 3. Finalizar
    setPantalla("finalizado");
  };

  const listaActual = listas.find(
    (lista) => lista.id === listaSeleccionada
  );

  return (
    <div className="app">

      {/* ENCABEZADO */}
      <header className="encabezado">
        <div className="logo-municipio">
          <div className="logo-icono">🗳️</div>

          <div>
            <span className="logo-superior">
              MUNICIPIO ESCOLAR
            </span>

            <span className="logo-institucional">
              ELECCIONES ESCOLARES
            </span>
          </div>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="contenido-principal">

        {/* INICIO */}
        {pantalla === "inicio" && (
          <div className="card card-inicio">

            <div className="icono-principal">
              🗳️
            </div>

            <span className="etiqueta">
              PROCESO ELECTORAL
            </span>

            <h1>
              Elecciones del
              <br />
              Municipio Escolar
            </h1>

            <p className="subtitulo">
              Ingresa tu DNI para verificar tu identidad
              y participar en el proceso electoral.
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
              <p className="error">{error}</p>
            )}

            <div className="seguridad">
              🔒 Tu participación es registrada de manera segura
            </div>
          </div>
        )}

        {/* CARNET */}
        {pantalla === "carnet" && estudiante && (
          <div className="card carnet">

            <div className="icono-principal">
              🪪
            </div>

            <span className="etiqueta">
              IDENTIFICACIÓN ELECTORAL
            </span>

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
              <span>✓</span>
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
              <p className="error">{error}</p>
            )}
          </div>
        )}

        {/* VOTACIÓN */}
        {pantalla === "votacion" && (
          <div className="card votacion">

            <div className="icono-principal">
              🗳️
            </div>

            <span className="etiqueta">
              CÉDULA ELECTORAL
            </span>

            <h1>Selecciona tu lista</h1>

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
                    borderLeft: `7px solid ${
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
                      LISTA {lista.numero}
                    </span>

                    <h2>{lista.nombre}</h2>

                    <p>
                      Candidato:{" "}
                      <strong>{lista.candidato}</strong>
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
                No hay listas disponibles.
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
              <p className="error">{error}</p>
            )}
          </div>
        )}

        {/* CONFIRMACIÓN */}
        {pantalla === "confirmacion" && (
          <div className="card confirmacion">

            <div className="icono-confirmacion">
              ⚠️
            </div>

            <span className="etiqueta">
              CONFIRMACIÓN
            </span>

            <h1>Confirma tu voto</h1>

            <p className="subtitulo">
              Revisa tu elección antes de registrar el voto.
            </p>

            <div className="seleccion-final">

              <span>Has seleccionado</span>

              <strong>
                LISTA {listaActual?.numero}
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
              <p className="error">{error}</p>
            )}
          </div>
        )}

        {/* FINALIZADO */}
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
              Tu participación ha sido registrada
              correctamente.
            </p>

            <div className="aviso-final">
              <strong>Gracias por participar.</strong>

              <span>
                Tu voto ha sido registrado de manera
                segura en las Elecciones del Municipio
                Escolar.
              </span>
            </div>

          </div>
        )}

      </main>

      {/* PIE DE PÁGINA */}
      <footer className="pie">

        <span>
          Elecciones del Municipio Escolar
        </span>

        <span className="punto">•</span>

        <span>
          Participación estudiantil
        </span>

      </footer>

    </div>
  );
}

export default App;