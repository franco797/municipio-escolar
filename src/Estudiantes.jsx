
import { useEffect, useMemo, useState } from "react";

function Estudiantes({ supabase, colegio, volver }) {
  const [estudiantes, setEstudiantes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [gradoSeleccionado, setGradoSeleccionado] = useState("todos");
  const [busqueda, setBusqueda] = useState("");

  const [modalAbierto, setModalAbierto] = useState(false);
  const [estudianteEditando, setEstudianteEditando] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const [formulario, setFormulario] = useState({
    dni: "",
    nombres: "",
    apellidos: "",
    grado: "",
    seccion: "",
    habilitado: true,
  });

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
        const comparador = new Intl.Collator("es", {
          numeric: true,
          sensitivity: "base",
        });

        const comparacionGrado = comparador.compare(
          a.grado || "",
          b.grado || ""
        );

        if (comparacionGrado !== 0) return comparacionGrado;

        const comparacionSeccion = comparador.compare(
          a.seccion || "",
          b.seccion || ""
        );

        if (comparacionSeccion !== 0) return comparacionSeccion;

        const comparacionApellido = comparador.compare(
          a.apellidos || "",
          b.apellidos || ""
        );

        if (comparacionApellido !== 0) return comparacionApellido;

        return comparador.compare(a.nombres || "", b.nombres || "");
      });

      setEstudiantes(ordenados);
    }

    setCargando(false);
  };

  useEffect(() => {
    setGradoSeleccionado("todos");
    setBusqueda("");
    cargarEstudiantes();

    const intervalo = setInterval(() => {
      cargarEstudiantes(false);
    }, 10000);

    return () => clearInterval(intervalo);
  }, [colegio?.id]);

  const grados = useMemo(() => {
    const comparador = new Intl.Collator("es", {
      numeric: true,
      sensitivity: "base",
    });

    return [
      ...new Set(
        estudiantes
          .map((estudiante) => String(estudiante.grado || "").trim())
          .filter(Boolean)
      ),
    ].sort(comparador.compare);
  }, [estudiantes]);

  const estudiantesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return estudiantes.filter((estudiante) => {
      const coincideGrado =
        gradoSeleccionado === "todos" ||
        String(estudiante.grado || "").trim() === gradoSeleccionado;

      const coincideBusqueda =
        !texto ||
        [
          estudiante.dni,
          estudiante.nombres,
          estudiante.apellidos,
          estudiante.grado,
          estudiante.seccion,
        ].some((valor) =>
          String(valor || "").toLowerCase().includes(texto)
        );

      return coincideGrado && coincideBusqueda;
    });
  }, [estudiantes, gradoSeleccionado, busqueda]);

  const pendientes = estudiantes.filter(
    (estudiante) => !estudiante.ya_voto
  ).length;

  const votaron = estudiantes.filter(
    (estudiante) => estudiante.ya_voto
  ).length;

  const abrirNuevo = () => {
    setEstudianteEditando(null);
    setFormulario({
      dni: "",
      nombres: "",
      apellidos: "",
      grado: gradoSeleccionado === "todos" ? "" : gradoSeleccionado,
      seccion: "",
      habilitado: true,
    });
    setError("");
    setMensaje("");
    setModalAbierto(true);
  };

  const abrirEdicion = (estudiante) => {
    setEstudianteEditando(estudiante);
    setFormulario({
      dni: String(estudiante.dni || ""),
      nombres: estudiante.nombres || "",
      apellidos: estudiante.apellidos || "",
      grado: estudiante.grado || "",
      seccion: estudiante.seccion || "",
      habilitado: Boolean(estudiante.habilitado),
    });
    setError("");
    setMensaje("");
    setModalAbierto(true);
  };

  const cambiarCampo = (campo, valor) => {
    setFormulario((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  };

  const guardarEstudiante = async (evento) => {
    evento.preventDefault();
    setError("");
    setMensaje("");

    if (guardando) return;

    if (!colegio?.id) {
      setError("No se ha seleccionado un colegio.");
      return;
    }

    const dni = formulario.dni.trim();
    const nombres = formulario.nombres.trim();
    const apellidos = formulario.apellidos.trim();
    const grado = formulario.grado.trim();
    const seccion = formulario.seccion.trim();

    if (!/^\d{8}$/.test(dni)) {
      setError("El DNI debe tener exactamente 8 dígitos.");
      return;
    }

    if (!nombres || !apellidos || !grado || !seccion) {
      setError("Completa todos los campos obligatorios.");
      return;
    }

    setGuardando(true);

    try {
      // Evitar registrar un DNI duplicado en el mismo colegio.
      let consultaDni = supabase
        .from("estudiantes")
        .select("id")
        .eq("colegio_id", colegio.id)
        .eq("dni", dni);

      if (estudianteEditando) {
        consultaDni = consultaDni.neq("id", estudianteEditando.id);
      }

      const { data: duplicados, error: errorDni } =
        await consultaDni;

      if (errorDni) {
        console.error("Error al comprobar DNI:", errorDni);
        setError("No se pudo verificar el DNI: " + errorDni.message);
        return;
      }

      if (duplicados?.length) {
        setError("Ya existe un estudiante con ese DNI en este colegio.");
        return;
      }

      if (estudianteEditando) {
        // No modificar el estado del voto al editar los datos.
        const { error: errorActualizar } = await supabase
          .from("estudiantes")
          .update({
            dni,
            nombres,
            apellidos,
            grado,
            seccion,
            habilitado: formulario.habilitado,
          })
          .eq("id", estudianteEditando.id)
          .eq("colegio_id", colegio.id);

        if (errorActualizar) {
          console.error("Error al editar estudiante:", errorActualizar);
          setError(
            "No se pudo guardar la modificación: " +
              errorActualizar.message
          );
          return;
        }

        setMensaje("Estudiante actualizado correctamente.");
      } else {
        const { error: errorInsertar } = await supabase
          .from("estudiantes")
          .insert({
            colegio_id: colegio.id,
            dni,
            nombres,
            apellidos,
            grado,
            seccion,
            habilitado: formulario.habilitado,
            ya_voto: false,
          });

        if (errorInsertar) {
          console.error("Error al añadir estudiante:", errorInsertar);
          setError(
            "No se pudo registrar al estudiante: " +
              errorInsertar.message
          );
          return;
        }

        setMensaje("Estudiante añadido correctamente.");
      }

      setModalAbierto(false);
      setEstudianteEditando(null);
      await cargarEstudiantes();
    } catch (errorInesperado) {
      console.error("Error al guardar estudiante:", errorInesperado);
      setError(
        errorInesperado?.message || "Ocurrió un error inesperado."
      );
    } finally {
      setGuardando(false);
    }
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

  const boton = {
    padding: "9px 12px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "600",
    fontSize: "13px",
  };

  const campoEstilo = {
    width: "100%",
    boxSizing: "border-box",
    padding: "11px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    fontSize: "14px",
    marginTop: "6px",
  };

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
        style={{ maxWidth: "1200px", width: "95%" }}
      >
        <div className="admin-icon">👨‍🎓</div>

        <h1>Estudiantes</h1>
        <p className="admin-welcome">{colegio?.nombre}</p>

        {mensaje && (
          <div
            role="status"
            style={{
              padding: "12px",
              margin: "12px 0",
              background: "#e7f7ec",
              color: "#18753b",
              borderRadius: "7px",
            }}
          >
            {mensaje}
          </div>
        )}

        {error && !modalAbierto && (
          <div className="admin-error" role="alert">
            {error}
            <button
              type="button"
              style={{ ...boton, marginLeft: "10px" }}
              onClick={() => cargarEstudiantes()}
            >
              VOLVER A INTENTAR
            </button>
          </div>
        )}

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            margin: "22px 0 14px",
          }}
        >
          <strong style={{ fontSize: "15px", color: "#26364a" }}>
            Lista de estudiantes
          </strong>

          <span
            style={{
              background: "#edf2f7",
              padding: "7px 11px",
              borderRadius: "6px",
              color: "#26364a",
              fontSize: "13px",
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
            marginBottom: "16px",
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
            Ya votaron: {votaron}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
            gap: "12px",
            marginBottom: "16px",
          }}
        >
          <div>
            <label
              htmlFor="filtro-grado"
              style={{ display: "block", fontWeight: "600", fontSize: "13px" }}
            >
              Filtrar por grado
            </label>

            <select
              id="filtro-grado"
              value={gradoSeleccionado}
              onChange={(e) => setGradoSeleccionado(e.target.value)}
              style={campoEstilo}
            >
              <option value="todos">Todos los grados</option>
              {grados.map((grado) => (
                <option key={grado} value={grado}>
                  {grado}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label
              htmlFor="buscar-estudiante"
              style={{ display: "block", fontWeight: "600", fontSize: "13px" }}
            >
              Buscar estudiante
            </label>

            <input
              id="buscar-estudiante"
              type="search"
              placeholder="DNI, nombres o apellidos..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={campoEstilo}
            />
          </div>
        </div>

        {cargando ? (
          <p>Cargando estudiantes...</p>
        ) : error && estudiantes.length === 0 ? (
          <p>No se pudieron mostrar los estudiantes.</p>
        ) : estudiantesFiltrados.length === 0 ? (
          <p style={{ padding: "15px 0" }}>
            {estudiantes.length === 0
              ? "Todavía no hay estudiantes registrados en este colegio."
              : "No hay estudiantes que coincidan con el filtro."}
          </p>
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
                minWidth: "850px",
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
                  <th style={encabezado}>Acción</th>
                </tr>
              </thead>

              <tbody>
                {estudiantesFiltrados.map((estudiante, indice) => (
                  <tr
                    key={estudiante.id}
                    style={{
                      background: indice % 2 === 0 ? "#fff" : "#f8fafc",
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
                      <span
                        style={{
                          color: estudiante.habilitado ? "#18753b" : "#b42318",
                          fontWeight: "600",
                        }}
                      >
                        {estudiante.habilitado
                          ? "Habilitado"
                          : "No habilitado"}
                      </span>
                    </td>

                    <td style={celda}>
                      <span style={etiquetaVotacion(estudiante.ya_voto)}>
                        {estudiante.ya_voto ? "Ya votó" : "Pendiente"}
                      </span>
                    </td>

                    <td style={celda}>
                      <button
                        type="button"
                        style={{
                          ...boton,
                          background: "#e8f1ff",
                          color: "#174ea6",
                        }}
                        onClick={() => abrirEdicion(estudiante)}
                      >
                        ✏️ Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <p style={{ fontSize: "13px", color: "#64748b" }}>
          Mostrando {estudiantesFiltrados.length} de {estudiantes.length}{" "}
          estudiantes.
        </p>

        <button
          type="button"
          style={{
            ...boton,
            width: "100%",
            padding: "14px",
            margin: "8px 0 14px",
            background: "#176b42",
            color: "#fff",
            fontSize: "14px",
          }}
          onClick={abrirNuevo}
        >
          + AÑADIR ESTUDIANTE
        </button>

        <button
          type="button"
          className="admin-btn-back"
          onClick={volver}
        >
          ← VOLVER
        </button>

        {modalAbierto && (
          <div
            role="presentation"
            onMouseDown={(e) => {
              if (e.target === e.currentTarget && !guardando) {
                setModalAbierto(false);
                setError("");
              }
            }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 1000,
              background: "rgba(15, 23, 42, 0.6)",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "16px",
              overflowY: "auto",
            }}
          >
            <section
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-formulario-estudiante"
              style={{
                width: "100%",
                maxWidth: "520px",
                maxHeight: "90vh",
                overflowY: "auto",
                background: "#fff",
                borderRadius: "12px",
                padding: "24px",
                boxSizing: "border-box",
                textAlign: "left",
                boxShadow: "0 15px 45px rgba(0,0,0,0.2)",
              }}
            >
              <h2
                id="titulo-formulario-estudiante"
                style={{ marginTop: 0, color: "#26364a" }}
              >
                {estudianteEditando
                  ? "Editar estudiante"
                  : "Añadir estudiante"}
              </h2>

              <p style={{ color: "#64748b", fontSize: "13px" }}>
                Colegio: {colegio?.nombre}
              </p>

              <form onSubmit={guardarEstudiante}>
                <div style={{ marginBottom: "12px" }}>
                  <label htmlFor="est-dni">DNI *</label>
                  <input
                    id="est-dni"
                    type="text"
                    inputMode="numeric"
                    maxLength={8}
                    required
                    value={formulario.dni}
                    onChange={(e) =>
                      cambiarCampo(
                        "dni",
                        e.target.value.replace(/\D/g, "").slice(0, 8)
                      )
                    }
                    style={campoEstilo}
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label htmlFor="est-nombres">Nombres *</label>
                  <input
                    id="est-nombres"
                    type="text"
                    required
                    value={formulario.nombres}
                    onChange={(e) => cambiarCampo("nombres", e.target.value)}
                    style={campoEstilo}
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label htmlFor="est-apellidos">Apellidos *</label>
                  <input
                    id="est-apellidos"
                    type="text"
                    required
                    value={formulario.apellidos}
                    onChange={(e) =>
                      cambiarCampo("apellidos", e.target.value)
                    }
                    style={campoEstilo}
                  />
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <div>
                    <label htmlFor="est-grado">Grado *</label>
                    <input
                      id="est-grado"
                      type="text"
                      list="grados-existentes"
                      placeholder="Ej. 1"
                      required
                      value={formulario.grado}
                      onChange={(e) => cambiarCampo("grado", e.target.value)}
                      style={campoEstilo}
                    />
                    <datalist id="grados-existentes">
                      {grados.map((grado) => (
                        <option key={grado} value={grado} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label htmlFor="est-seccion">Sección *</label>
                    <input
                      id="est-seccion"
                      type="text"
                      required
                      placeholder="Ej. A"
                      value={formulario.seccion}
                      onChange={(e) =>
                        cambiarCampo("seccion", e.target.value)
                      }
                      style={campoEstilo}
                    />
                  </div>
                </div>

                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    margin: "18px 0",
                    fontSize: "14px",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={formulario.habilitado}
                    onChange={(e) =>
                      cambiarCampo("habilitado", e.target.checked)
                    }
                  />
                  Habilitado para votar
                </label>

                {estudianteEditando?.ya_voto && (
                  <p
                    style={{
                      padding: "10px",
                      background: "#fff7e6",
                      color: "#8a5300",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    Este estudiante ya votó. Editar sus datos no cambiará ese
                    registro.
                  </p>
                )}

                {error && (
                  <div
                    role="alert"
                    style={{
                      padding: "11px",
                      marginBottom: "12px",
                      background: "#fdeaea",
                      color: "#b42318",
                      borderRadius: "6px",
                      fontSize: "13px",
                    }}
                  >
                    {error}
                  </div>
                )}

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "20px",
                  }}
                >
                  <button
                    type="button"
                    disabled={guardando}
                    onClick={() => {
                      setModalAbierto(false);
                      setError("");
                    }}
                    style={{
                      ...boton,
                      flex: 1,
                      padding: "12px",
                      background: "#e9edf2",
                      color: "#26364a",
                    }}
                  >
                    CANCELAR
                  </button>

                  <button
                    type="submit"
                    disabled={guardando}
                    style={{
                      ...boton,
                      flex: 1,
                      padding: "12px",
                      background: "#176b42",
                      color: "#fff",
                      opacity: guardando ? 0.7 : 1,
                    }}
                  >
                    {guardando
                      ? "GUARDANDO..."
                      : estudianteEditando
                        ? "GUARDAR CAMBIOS"
                        : "AÑADIR ESTUDIANTE"}
                  </button>
                </div>
              </form>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

export default Estudiantes;
