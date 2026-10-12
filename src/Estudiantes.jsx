
import { useEffect, useState } from "react";

function Estudiantes({ supabase, colegio, volver }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEstudiantes();
  }, [colegio?.id]);

  const cargarEstudiantes = async () => {
    if (!colegio?.id) {
      setError("No se ha seleccionado un colegio.");
      setEstudiantes([]);
      setCargando(false);
      return;
    }

    setCargando(true);
    setError("");

    const { data, error: errorConsulta } = await supabase
      .from("estudiantes")
      .select("*")
      .eq("colegio_id", colegio.id);

    if (errorConsulta) {
      console.error("Error al cargar estudiantes:", errorConsulta);
      setError(
        "No se pudieron cargar los estudiantes: " +
          errorConsulta.message
      );
      setEstudiantes([]);
    } else {
      const ordenados = (data || []).sort((a, b) => {
        const gradoA = parseInt(a.grado, 10) || 0;
        const gradoB = parseInt(b.grado, 10) || 0;

        if (gradoA !== gradoB) {
          return gradoA - gradoB;
        }

        const apellido = (a.apellidos || "").localeCompare(
          b.apellidos || "",
          "es",
          { sensitivity: "base" }
        );

        if (apellido !== 0) {
          return apellido;
        }

        return (a.nombres || "").localeCompare(
          b.nombres || "",
          "es",
          { sensitivity: "base" }
        );
      });

      setEstudiantes(ordenados);
    }

    setCargando(false);
  };

  const encabezado = {
    padding: "11px 12px",
    textAlign: "left",
    background: "#f0f3f7",
    color: "#26364a",
    borderBottom: "2px solid #d5dce5",
    fontSize: "13px",
    whiteSpace: "nowrap",
  };

  const celda = {
    padding: "10px 12px",
    borderBottom: "1px solid #e2e6eb",
    fontSize: "13px",
    color: "#263238",
    whiteSpace: "nowrap",
  };

  return (
    <div className="admin-container">
      <div
        className="admin-panel"
        style={{ maxWidth: "1100px", width: "95%" }}
      >
        <div className="admin-icon">👨‍🎓</div>

        <h1>Estudiantes</h1>

        <p className="admin-welcome">
          {colegio?.nombre}
        </p>

        {cargando && <p>Cargando estudiantes...</p>}

        {error && (
          <div className="admin-error">
            {error}
            <button
              className="admin-btn-primary"
              onClick={cargarEstudiantes}
            >
              VOLVER A INTENTAR
            </button>
          </div>
        )}

        {!cargando && !error && (
          <>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
                margin: "20px 0 12px",
              }}
            >
              <strong
                style={{ fontSize: "14px", color: "#26364a" }}
              >
                Lista de estudiantes
              </strong>

              <span
                style={{
                  fontSize: "13px",
                  background: "#edf2f7",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  color: "#26364a",
                }}
              >
                Total: {estudiantes.length}
              </span>
            </div>

            {estudiantes.length === 0 ? (
              <p>No hay estudiantes registrados en este colegio.</p>
            ) : (
              <div
                style={{
                  width: "100%",
                  overflowX: "auto",
                  border: "1px solid #d5dce5",
                  borderRadius: "8px",
                  marginBottom: "18px",
                  background: "#fff",
                }}
              >
                <table
                  style={{
                    width: "100%",
                    minWidth: "700px",
                    borderCollapse: "collapse",
                    textAlign: "left",
                  }}
                >
                  <thead>
                    <tr>
                      <th style={encabezado}>N.º</th>
                      <th style={encabezado}>DNI</th>
                      <th style={encabezado}>Apellidos y nombres</th>
                      <th style={encabezado}>Grado</th>
                      <th style={encabezado}>Sección</th>
                      <th style={encabezado}>Estado</th>
                      <th style={encabezado}>Votación</th>
                    </tr>
                  </thead>

                  <tbody>
                    {estudiantes.map((estudiante, indice) => (
                      <tr
                        key={estudiante.id}
                        style={{
                          background:
                            indice % 2 === 0
                              ? "#ffffff"
                              : "#f8fafc",
                        }}
                      >
                        <td style={celda}>{indice + 1}</td>
                        <td style={celda}>{estudiante.dni}</td>
                        <td style={{ ...celda, fontWeight: "500" }}>
                          {estudiante.apellidos}, {estudiante.nombres}
                        </td>
                        <td style={celda}>{estudiante.grado}</td>
                        <td style={celda}>{estudiante.seccion}</td>
                        <td style={celda}>
                          {estudiante.habilitado
                            ? "Habilitado"
                            : "No habilitado"}
                        </td>
                        <td style={celda}>
                          {estudiante.ya_voto
                            ? "Ya votó"
                            : "Pendiente"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
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
