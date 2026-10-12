import { useState } from "react";
import * as XLSX from "xlsx";
import "./ConfiguracionEleccion.css";

function ConfiguracionEleccion({ supabase, colegio, volver }) {
  const [archivo, setArchivo] = useState(null);
  const [importando, setImportando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [tipoMensaje, setTipoMensaje] = useState("");
  const [cantidadImportada, setCantidadImportada] = useState(0);

  const normalizar = (valor) =>
    String(valor ?? "")
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase();

  const importarEstudiantes = async (evento) => {
    evento.preventDefault();
    setMensaje("");
    setTipoMensaje("");
    setCantidadImportada(0);

    if (!colegio?.id) {
      setMensaje("No se ha seleccionado un colegio.");
      setTipoMensaje("error");
      return;
    }

    if (!archivo) {
      setMensaje("Primero selecciona un archivo Excel.");
      setTipoMensaje("error");
      return;
    }

    setImportando(true);

    try {
      const bytes = await archivo.arrayBuffer();
      const libro = XLSX.read(bytes, { type: "array" });
      const primeraHoja = libro.Sheets[libro.SheetNames[0]];

      const filas = XLSX.utils.sheet_to_json(primeraHoja, {
        defval: "",
        raw: false,
      });

      if (!filas.length) {
        throw new Error("El Excel está vacío o no contiene filas de estudiantes.");
      }

      const columnas = Object.keys(filas[0]);
      const encontrarColumna = (nombre) =>
        columnas.find((columna) => normalizar(columna) === normalizar(nombre));

      const colDni = encontrarColumna("DNI");
      const colNombres = encontrarColumna("Nombres");
      const colApellidos = encontrarColumna("Apellidos");
      const colGrado = encontrarColumna("Grado");
      const colSeccion = encontrarColumna("Seccion");

      if (!colDni || !colNombres || !colApellidos || !colGrado || !colSeccion) {
        throw new Error(
          "Revisa los encabezados del Excel. Debe tener: DNI, Nombres, Apellidos, Grado y Sección."
        );
      }

      const estudiantes = filas
        .filter((fila) =>
          [colDni, colNombres, colApellidos, colGrado, colSeccion].some(
            (columna) => String(fila[columna] ?? "").trim() !== ""
          )
        )
        .map((fila, indice) => ({
          dni: String(fila[colDni] ?? "").replace(/\.0$/, "").trim(),
          nombres: String(fila[colNombres] ?? "").trim(),
          apellidos: String(fila[colApellidos] ?? "").trim(),
          grado: String(fila[colGrado] ?? "").trim(),
          seccion: String(fila[colSeccion] ?? "").trim(),
          filaExcel: indice + 2,
        }));

      if (!estudiantes.length) {
        throw new Error("No se encontraron estudiantes para importar.");
      }

      const dniVistos = new Set();
      const errores = [];

      for (const estudiante of estudiantes) {
        if (!/^\d{8}$/.test(estudiante.dni)) {
          errores.push(`Fila ${estudiante.filaExcel}: el DNI debe tener 8 dígitos.`);
        } else if (
          !estudiante.nombres ||
          !estudiante.apellidos ||
          !estudiante.grado ||
          !estudiante.seccion
        ) {
          errores.push(`Fila ${estudiante.filaExcel}: faltan datos de un estudiante.`);
        } else if (dniVistos.has(estudiante.dni)) {
          errores.push(`Fila ${estudiante.filaExcel}: DNI repetido (${estudiante.dni}).`);
        }
        dniVistos.add(estudiante.dni);
      }

      if (errores.length) {
        throw new Error(errores.slice(0, 8).join(" ") +
          (errores.length > 8 ? ` Y ${errores.length - 8} errores más.` : ""));
      }

      const { data: existentes, error: errorConsulta } = await supabase
        .from("estudiantes")
        .select("dni")
        .eq("colegio_id", colegio.id);

      if (errorConsulta) throw errorConsulta;

      const dnisExistentes = new Set(
        (existentes || []).map((estudiante) => String(estudiante.dni).trim())
      );
      const repetidos = estudiantes
        .filter((estudiante) => dnisExistentes.has(estudiante.dni))
        .map((estudiante) => estudiante.dni);

      if (repetidos.length) {
        throw new Error(
          `Estos DNI ya están registrados en este colegio: ${repetidos.slice(0, 8).join(", ")}${
            repetidos.length > 8 ? " y otros." : "."
          } No se importó ningún estudiante.`
        );
      }

      const registros = estudiantes.map(({ filaExcel, ...estudiante }) => ({
        ...estudiante,
        colegio_id: colegio.id,
        habilitado: true,
        ya_voto: false,
      }));

      const { error: errorInsercion } = await supabase
        .from("estudiantes")
        .insert(registros);

      if (errorInsercion) throw errorInsercion;

      setCantidadImportada(registros.length);
      setArchivo(null);
      evento.target.reset();
      setMensaje(`¡Importación completada! Se registraron ${registros.length} estudiantes.`);
      setTipoMensaje("exito");
    } catch (error) {
      console.error("Error al importar estudiantes:", error);
      setMensaje(error?.message || "No se pudo importar el archivo.");
      setTipoMensaje("error");
    } finally {
      setImportando(false);
    }
  };

  return (
    <div className="config-eleccion-container">
      <section className="config-eleccion-panel">
        <div className="config-eleccion-icono" aria-hidden="true">⚙️</div>
        <h1>Configurar elección</h1>
        <p className="config-eleccion-colegio">{colegio?.nombre || "Colegio no seleccionado"}</p>

        <div className="config-eleccion-seccion">
          <h2>Importar estudiantes desde Excel</h2>
          <p>
            El archivo debe tener estas columnas en la primera fila:
            <strong> DNI, Nombres, Apellidos, Grado y Sección</strong>.
          </p>

          <form onSubmit={importarEstudiantes}>
            <label htmlFor="archivo-estudiantes">Selecciona el archivo Excel (.xlsx o .xls)</label>
            <input
              id="archivo-estudiantes"
              type="file"
              accept=".xlsx,.xls"
              onChange={(evento) => {
                setArchivo(evento.target.files?.[0] || null);
                setMensaje("");
                setTipoMensaje("");
              }}
            />

            <button
              className="config-eleccion-boton"
              type="submit"
              disabled={importando}
            >
              {importando ? "IMPORTANDO..." : "IMPORTAR ESTUDIANTES"}
            </button>
          </form>

          {mensaje && (
            <div className={`config-eleccion-mensaje ${tipoMensaje}`}>
              {mensaje}
            </div>
          )}

          {tipoMensaje === "exito" && cantidadImportada > 0 && (
            <p className="config-eleccion-ayuda">
              Ahora puedes entrar a “Ver estudiantes” para comprobar el registro.
            </p>
          )}
        </div>

        <button className="config-eleccion-volver" type="button" onClick={volver}>
          ← VOLVER
        </button>
      </section>
    </div>
  );
}

export default ConfiguracionEleccion;
