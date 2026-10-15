import { useEffect, useState } from "react";

function Estudiantes({ supabase, colegio, volver }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarEstudiantes();

    const intervalo = setInterval(() => {
      cargarEstudiantes(false);
    }, 5000);

    return () => clearInterval(intervalo);
  }, [colegio?.id]);

  const cargarEstudiantes = async (mostrarCarga = true) => {
    if (!colegio?.id) {
      setError("No se ha seleccionado un colegio.");
      setEstudiantes([]);
      setCargando(false);
      return;
    }

    if (mostrarCarga) setCargando(true);
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
    } else {
      const ordenados = (data || []).sort((a, b) => {
        if (a.ya_voto !== b.ya_voto) {
          return a.ya_voto ? 1 : -1;
        }

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

        if (apellido !== 0) return apellido;

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

  const pendientes = estudiantes.filter(
    (estudiante) => !estudiante.ya_voto
  ).length;

  const votaron = estudiantes.filter(
    (estudiante) => estudiante.ya_voto
  ).length;

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

  const indicador = (color) => ({
    display: "inline-block",
    width: "11px",
    height: "11px",
    background: color,
    borderRadius: "2px",
    marginRight: "7px",
    verticalAlign: "middle",
  });

  const etiquetaVotacion = (yaVoto) => ({
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 9px",
    borderRadius: "5px",
    background: yaVoto ? "#e7f7ec" : "#fdeaea",
    color: yaVoto ? "#18753b" : "#b42318",
    fontWeight: "600",
    fontSize: "12px",
  });

  return (
    <div className="admin-container">
      <div
        className="admin-panel"
        style={{ maxWidth: "1100px", width: "95%" }}
      >
        <div className="admin-icon">👨‍🎓</div>

        <h1>Estudiantes</h1>

        <p className="admin-welcome">{colegio?.nombre}</p>

        {cargando && <p>Cargando estudiantes...</p>}

        {error && (
          <div className="admin-error">
            {error}
            <button
              type="button"
              className="admin-btn-primary"
              onClick={() => cargarEstudiantes()}
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
              <strong style={{ fontSize: "14px", color: "#26364a" }}>
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

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "15px",
              }}
            >
              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: "#fdeaea",
                  color: "#b42318",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                <span style={indicador("#dc2626")} />
                Pendientes: {pendientes}
              </div>

              <div
                style={{
                  padding: "9px 12px",
                  borderRadius: "6px",
                  background: "#e7f7ec",
                  color: "#18753b",
                  fontSize: "13px",
                  fontWeight: "600",
                }}
              >
                <span style={indicador("#16a34a")} />
                Ya votaron: {votaron}
              </div>
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
                            indice % 2 === 0 ? "#ffffff" : "#f8fafc",
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
                          <span
                            style={etiquetaVotacion(estudiante.ya_voto)}
                          >
                            <span
                              style={indicador(
                                estudiante.ya_voto
                                  ? "#16a34a"
                                  : "#dc2626"
                              )}
                            />
                            {estudiante.ya_voto ? "Ya votó" : "Pendiente"}
                          </span>
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
          type="button"
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