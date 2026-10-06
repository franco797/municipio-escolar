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

  // REGISTRAR VOTO
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

  return (
    <div className="app">

      {/* INICIO */}
      {pantalla === "inicio" && (
        <div className="card">
          <div className="icono">🗳️</div>

          <h1>Elecciones del Municipio Escolar</h1>

          <p className="subtitulo">
            Ingresa tu DNI para verificar tu identidad
          </p>

          <label htmlFor="dni">
            Número de DNI
          </label>

          <input
            id="dni"
            type="text"
            inputMode="numeric"
            maxLength="8"
            placeholder="Ejemplo: 12345678"
            value={dni}
            onChange={(e) => {
              setDni(
                e.target.value.replace(/\D/g, "")
              );
              setError("");
            }}
          />

          <button onClick={buscarEstudiante}>
            CONTINUAR
          </button>

          {error && (
            <p className="error">{error}</p>
          )}
        </div>
      )}

      {/* CARNET */}
      {pantalla === "carnet" && estudiante && (
        <div className="card carnet">
          <div className="icono">🪪</div>

          <h1>Carnet Electoral</h1>

          <div className="datos">

            <p>
              <strong>Nombres:</strong>{" "}
              {estudiante.nombres}
            </p>

            <p>
              <strong>Apellidos:</strong>{" "}
              {estudiante.apellidos}
            </p>

            <p>
              <strong>Grado:</strong>{" "}
              {estudiante.grado}
            </p>

            <p>
              <strong>Sección:</strong>{" "}
              {estudiante.seccion}
            </p>

            <div className="habilitado">
              ✓ ESTUDIANTE HABILITADO
            </div>

          </div>

          <button onClick={irAVotar}>
            INGRESAR A VOTAR
          </button>

          {error && (
            <p className="error">{error}</p>
          )}
        </div>
      )}

      {/* VOTACIÓN */}
      {pantalla === "votacion" && (
        <div className="card votacion">

          <div className="icono">🗳️</div>

          <h1>Cédula de Votación</h1>

          <p className="subtitulo">
            Selecciona una sola lista
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
                  borderLeft: `8px solid ${
                    lista.color || "#2563eb"
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

                <div>

                  <h2>
                    {lista.nombre}
                  </h2>

                  <p>
                    Candidato:{" "}
                    {lista.candidato}
                  </p>

                </div>

              </div>
            ))}

          </div>

          {listas.length === 0 && (
            <p>
              No hay listas disponibles.
            </p>
          )}

          <button onClick={confirmarVoto}>
            CONTINUAR
          </button>

          {error && (
            <p className="error">{error}</p>
          )}

        </div>
      )}

      {/* CONFIRMACIÓN */}
      {pantalla === "confirmacion" && (
        <div className="card">

          <div className="icono">⚠️</div>

          <h1>Confirmar voto</h1>

          <p className="subtitulo">
            Has seleccionado:
          </p>

          <div className="seleccion-final">

            <strong>
              Lista{" "}
              {
                listas.find(
                  (lista) =>
                    lista.id === listaSeleccionada
                )?.numero
              }
            </strong>

          </div>

          <p>
            ¿Estás seguro de tu elección?
          </p>

          <div className="botones">

            <button
              className="secundario"
              onClick={() =>
                setPantalla("votacion")
              }
            >
              CAMBIAR
            </button>

            <button onClick={registrarVoto}>
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
        <div className="card">

          <div className="icono">✅</div>

          <h1>
            ¡Voto registrado!
          </h1>

          <p className="subtitulo">
            Tu participación ha sido registrada
            correctamente.
          </p>

          <div className="aviso-final">
            Gracias por participar en las elecciones
            del Municipio Escolar.
          </div>

        </div>
      )}

    </div>
  );
}

export default App;