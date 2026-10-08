import { useEffect, useState } from "react";

function Estudiantes({ supabase, colegio, volver }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEstudiantes();
  }, [colegio]);

  const cargarEstudiantes = async () => {
    setCargando(true);
    setError("");

    const { data, error } = await supabase
      .from("estudiantes")
      .select("*")
      .eq("colegio_id", colegio.id)
      .order("apellidos", { ascending: true });

    console.log("ESTUDIANTES DEL COLEGIO:", data);
    console.log("ERROR ESTUDIANTES:", error);

    if (error) {
      console.error(error);
      setError("No se pudieron cargar los estudiantes.");
      setEstudiantes([]);
      setCargando(false);
      return;
    }

    setEstudiantes(data || []);
    setCargando(false);
  };

  return (
    <div className="admin-container">
      <div className="admin-panel">

        <div className="admin-icon">👨‍🎓</div>

        <h1>Estudiantes</h1>

        <p className="admin-welcome">
          {colegio?.nombre}
        </p>

        {cargando && (
          <p>Cargando estudiantes...</p>
        )}

        {error && (
          <div className="admin-error">
            {error}
          </div>
        )}

        {!cargando && !error && estudiantes.length === 0 && (
          <p>
            No hay estudiantes registrados en este colegio.
          </p>
        )}

        {!cargando && estudiantes.length > 0 && (
          <div className="admin-actions">

            {estudiantes.map((estudiante) => (
              <div
                key={estudiante.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "10px",
                  textAlign: "left",
                  background: "#fff",
                }}
              >
                <strong>
                  {estudiante.nombres} {estudiante.apellidos}
                </strong>

                <p>
                  DNI: {estudiante.dni}
                </p>

                <p>
                  Edad: {estudiante.edad}
                </p>

                <p>
                  Grado: {estudiante.grado}
                </p>

                <p>
                  Sección: {estudiante.seccion}
                </p>

                <p>
                  Estado:{" "}
                  {estudiante.habilitado
                    ? "Habilitado"
                    : "No habilitado"}
                </p>

                <p>
                  Voto:{" "}
                  {estudiante.ya_voto
                    ? "Ya votó"
                    : "No ha votado"}
                </p>

              </div>
            ))}

          </div>
        )}

        <button
          className="admin-btn-back"
          onClick={volver}
        >
          ← VOLVER
        </button>

      </div>
    </div>
  );
}

export default Estudiantes;