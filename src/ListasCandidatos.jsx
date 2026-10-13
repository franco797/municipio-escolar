
import { useEffect, useState } from "react";

// Muestra una imagen o un recuadro si no se puede cargar.
function ImagenConRespaldo({
  src,
  alt,
  estilo,
  texto,
  ajuste = "contain",
}) {
  const [fallo, setFallo] = useState(false);

  useEffect(() => {
    setFallo(false);
  }, [src]);

  const urlImagen = typeof src === "string" ? src.trim() : "";

  return (
    <div
      style={{
        ...estilo,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        flexShrink: 0,
        boxSizing: "border-box",
        position: "relative",
      }}
    >
      {urlImagen && !fallo ? (
        <img
          src={urlImagen}
          alt={alt || ""}
          onError={() => setFallo(true)}
          style={{
            display: "block",
            width: "100%",
            height: "100%",
            objectFit: ajuste,
            objectPosition: "center top",
          }}
        />
      ) : (
        <span
          style={{
            color: "#64748b",
            fontSize: "12px",
            textAlign: "center",
            padding: "8px",
            overflowWrap: "anywhere",
          }}
        >
          {texto || "Imagen no disponible"}
        </span>
      )}
    </div>
  );
}

// Vista previa de archivos antes de guardarlos.
function VistaPreviaArchivo({
  archivo,
  texto,
  estilo,
  ajuste = "contain",
}) {
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!archivo) {
      setUrl("");
      return undefined;
    }

    const nuevaUrl = URL.createObjectURL(archivo);
    setUrl(nuevaUrl);

    return () => URL.revokeObjectURL(nuevaUrl);
  }, [archivo]);

  return (
    <ImagenConRespaldo
      src={url}
      alt={texto}
      texto={texto}
      estilo={estilo}
      ajuste={ajuste}
    />
  );
}

function ListasCandidatos({ supabase, colegio, volver }) {
  const [listas, setListas] = useState([]);
  const [candidatos, setCandidatos] = useState([]);

  const [numero, setNumero] = useState("");
  const [nombreLista, setNombreLista] = useState("");
  const [color, setColor] = useState("#1d4ed8");

  const [nombresAlcalde, setNombresAlcalde] = useState("");
  const [apellidosAlcalde, setApellidosAlcalde] = useState("");

  const [logo, setLogo] = useState(null);
  const [fotoAlcalde, setFotoAlcalde] = useState(null);

  const [listaElegida, setListaElegida] = useState("");
  const [nombres, setNombres] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cargo, setCargo] = useState("Teniente alcalde");
  const [fotoCandidato, setFotoCandidato] = useState(null);

  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const estilos = {
    pagina: {
      minHeight: "100vh",
      padding: "30px 16px",
      background: "#f1f5f9",
      color: "#1e293b",
      fontFamily: "Arial, sans-serif",
      boxSizing: "border-box",
    },
    principal: {
      maxWidth: "1050px",
      margin: "0 auto",
    },
    encabezado: {
      background: "#173b70",
      color: "#fff",
      padding: "28px",
      borderRadius: "16px",
      marginBottom: "24px",
      boxShadow: "0 5px 18px rgba(15,23,42,0.12)",
    },
    titulo: {
      margin: "0 0 10px",
      fontSize: "30px",
      color: "#fff",
    },
    subtitulo: {
      margin: 0,
      color: "#dbeafe",
      fontSize: "16px",
    },
    panel: {
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "14px",
      padding: "24px",
      marginBottom: "24px",
      boxShadow: "0 4px 15px rgba(15,23,42,0.05)",
      boxSizing: "border-box",
    },
    tituloPanel: {
      color: "#173b70",
      margin: "0 0 22px",
      fontSize: "22px",
    },
    etiqueta: {
      display: "block",
      marginBottom: "7px",
      color: "#334155",
      fontWeight: "bold",
      fontSize: "14px",
    },
    campo: {
      display: "block",
      width: "100%",
      padding: "12px",
      marginBottom: "17px",
      border: "1px solid #cbd5e1",
      borderRadius: "8px",
      background: "#fff",
      color: "#1e293b",
      fontSize: "15px",
      boxSizing: "border-box",
    },
    boton: {
      padding: "12px 19px",
      border: "none",
      borderRadius: "8px",
      background: "#1d4ed8",
      color: "#fff",
      fontSize: "14px",
      fontWeight: "bold",
      cursor: "pointer",
    },
    tarjetaLista: {
      overflow: "hidden",
      marginBottom: "24px",
      background: "#fff",
      border: "1px solid #e2e8f0",
      borderRadius: "15px",
      boxShadow: "0 5px 18px rgba(15,23,42,0.07)",
    },
    cabeceraLista: {
      display: "flex",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "20px",
      padding: "24px",
    },
    logo: {
      width: "115px",
      height: "115px",
      background: "#f8fafc",
      border: "1px solid #cbd5e1",
      borderRadius: "12px",
    },
    fotoAlcalde: {
      width: "135px",
      height: "160px",
      background: "#f1f5f9",
      border: "2px solid #cbd5e1",
      borderRadius: "12px",
    },
    seccionIntegrantes: {
      padding: "20px 24px",
      background: "#f8fafc",
      borderTop: "1px solid #e2e8f0",
    },
    integrante: {
      display: "flex",
      alignItems: "center",
      gap: "14px",
      padding: "14px 0",
      borderBottom: "1px solid #e2e8f0",
    },
    fotoIntegrante: {
      width: "58px",
      height: "66px",
      background: "#e2e8f0",
      borderRadius: "9px",
    },
    mensajeExito: {
      padding: "13px 16px",
      marginBottom: "18px",
      borderRadius: "8px",
      background: "#dcfce7",
      color: "#166534",
      border: "1px solid #bbf7d0",
    },
    mensajeError: {
      padding: "13px 16px",
      marginBottom: "18px",
      borderRadius: "8px",
      background: "#fee2e2",
      color: "#991b1b",
      border: "1px solid #fecaca",
      overflowWrap: "anywhere",
    },
    botonVolver: {
      padding: "12px 19px",
      border: "none",
      borderRadius: "8px",
      background: "#475569",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "8px",
    },
  };

  useEffect(() => {
    cargarListas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colegio?.id]);

  const subirFoto = async (archivo, carpeta) => {
    if (!archivo) return null;

    if (!archivo.type.startsWith("image/")) {
      throw new Error("Selecciona un archivo de imagen válido.");
    }

    if (archivo.size > 5 * 1024 * 1024) {
      throw new Error("Cada imagen debe pesar máximo 5 MB.");
    }

    if (!colegio?.id) {
      throw new Error("No has seleccionado un colegio.");
    }

    const extensionOriginal = archivo.name
      .split(".")
      .pop()
      ?.toLowerCase();

    const extension = /^[a-z0-9]+$/.test(extensionOriginal || "")
      ? extensionOriginal
      : "jpg";

    const ruta = `${colegio.id}/${carpeta}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from("Listas-fotos")
      .upload(ruta, archivo, {
        upsert: false,
        contentType: archivo.type,
      });

    if (errorSubida) throw errorSubida;

    const { data } = supabase.storage
      .from("Listas-fotos")
      .getPublicUrl(ruta);

    if (!data?.publicUrl) {
      throw new Error("No se pudo obtener la URL pública de la imagen.");
    }

    return data.publicUrl;
  };

  const cargarListas = async () => {
    if (!colegio?.id) {
      setListas([]);
      setCandidatos([]);
      return;
    }

    setError("");
    setCargando(true);

    try {
      const { data: datosListas, error: errorListas } = await supabase
        .from("listas")
        .select("*")
        .eq("colegio_id", colegio.id)
        .order("numero", { ascending: true });

      if (errorListas) throw errorListas;

      const listaActual = datosListas || [];
      setListas(listaActual);

      if (listaActual.length === 0) {
        setCandidatos([]);
        return;
      }

      const ids = listaActual.map((lista) => lista.id);

      const { data: datosCandidatos, error: errorCandidatos } =
        await supabase
          .from("candidatos")
          .select("*")
          .in("lista_id", ids)
          .order("id", { ascending: true });

      if (errorCandidatos) throw errorCandidatos;

      setCandidatos(datosCandidatos || []);
    } catch (e) {
      console.error("Error al cargar listas y candidatos:", e);
      setError(
        "No se pudieron cargar las listas: " +
          (e.message || "Error desconocido")
      );
    } finally {
      setCargando(false);
    }
  };

  const registrarLista = async (evento) => {
    evento.preventDefault();
    setMensaje("");
    setError("");

    if (!colegio?.id) {
      setError("No has seleccionado un colegio.");
      return;
    }

    if (!logo || !fotoAlcalde) {
      setError("Selecciona el logo de la lista y la foto del alcalde.");
      return;
    }

    if (!numero || Number(numero) < 1 || !nombreLista.trim()) {
      setError("Ingresa un número válido y el nombre de la lista.");
      return;
    }

    setCargando(true);

    try {
      const logoUrl = await subirFoto(logo, "logo");
      const fotoUrl = await subirFoto(fotoAlcalde, "alcalde");

      const nombreCompleto =
        `${nombresAlcalde.trim()} ${apellidosAlcalde.trim()}`.trim();

      const { data: nuevaLista, error: errorLista } = await supabase
        .from("listas")
        .insert({
          numero: Number(numero),
          nombre: nombreLista.trim(),
          candidato: nombreCompleto,
          color,
          colegio_id: colegio.id,
          logo_url: logoUrl,
          foto_candidato_url: fotoUrl,
        })
        .select()
        .single();

      if (errorLista) throw errorLista;

      const { error: errorCandidato } = await supabase
        .from("candidatos")
        .insert({
          lista_id: nuevaLista.id,
          nombres: nombresAlcalde.trim(),
          apellidos: apellidosAlcalde.trim(),
          cargo: "Alcalde escolar",
          foto_url: fotoUrl,
        });

      if (errorCandidato) {
        throw new Error(
          "La lista se guardó, pero no se pudo registrar al alcalde: " +
            errorCandidato.message
        );
      }

      setNumero("");
      setNombreLista("");
      setNombresAlcalde("");
      setApellidosAlcalde("");
      setLogo(null);
      setFotoAlcalde(null);
      evento.target.reset();

      setMensaje("¡Lista y candidato a alcalde registrados correctamente!");
      await cargarListas();
    } catch (e) {
      console.error("Error al registrar lista:", e);
      setError(e.message || "No se pudo registrar la lista.");
    } finally {
      setCargando(false);
    }
  };

  const agregarCandidato = async (evento) => {
    evento.preventDefault();
    setMensaje("");
    setError("");

    if (!colegio?.id) {
      setError("No has seleccionado un colegio.");
      return;
    }

    if (!listaElegida) {
      setError("Selecciona una lista.");
      return;
    }

    if (!nombres.trim() || !apellidos.trim()) {
      setError("Escribe los nombres y apellidos del integrante.");
      return;
    }

    setCargando(true);

    try {
      const fotoUrl = fotoCandidato
        ? await subirFoto(fotoCandidato, "candidato")
        : null;

      const { error: errorInsercion } = await supabase
        .from("candidatos")
        .insert({
          lista_id: Number(listaElegida),
          nombres: nombres.trim(),
          apellidos: apellidos.trim(),
          cargo,
          foto_url: fotoUrl,
        });

      if (errorInsercion) throw errorInsercion;

      setNombres("");
      setApellidos("");
      setFotoCandidato(null);
      evento.target.reset();
      setCargo("Teniente alcalde");

      setMensaje("Candidato agregado correctamente.");
      await cargarListas();
    } catch (e) {
      console.error("Error al agregar candidato:", e);
      setError(e.message || "No se pudo agregar el candidato.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={estilos.pagina}>
      <main style={estilos.principal}>
        <header style={estilos.encabezado}>
          <h1 style={estilos.titulo}>Listas y candidatos</h1>
          <p style={estilos.subtitulo}>
            Colegio: {colegio?.nombre || "Sin colegio seleccionado"}
          </p>
        </header>

        {mensaje && (
          <div style={estilos.mensajeExito} role="status">
            {mensaje}
          </div>
        )}

        {error && (
          <div style={estilos.mensajeError} role="alert">
            {error}
          </div>
        )}

        <section style={estilos.panel}>
          <h2 style={estilos.tituloPanel}>Registrar nueva lista</h2>

          <form onSubmit={registrarLista}>
            <label style={estilos.etiqueta}>Número de lista</label>
            <input
              style={estilos.campo}
              type="number"
              min="1"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />

            <label style={estilos.etiqueta}>
              Nombre de la lista o partido
            </label>
            <input
              style={estilos.campo}
              value={nombreLista}
              onChange={(e) => setNombreLista(e.target.value)}
              placeholder="Ej. Unidos por nuestro colegio"
              required
            />

            <label style={estilos.etiqueta}>Color de la lista</label>
            <input
              style={{ ...estilos.campo, height: "48px", padding: "5px" }}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />

            <label style={estilos.etiqueta}>Logo de campaña</label>
            <div style={{ marginBottom: "12px" }}>
              <VistaPreviaArchivo
                archivo={logo}
                texto="Vista previa del logo"
                estilo={estilos.logo}
              />
            </div>
            <input
              style={estilos.campo}
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              required
            />

            <h3 style={{ color: "#173b70", marginTop: "26px" }}>
              Candidato a alcalde escolar
            </h3>

            <label style={estilos.etiqueta}>Nombres</label>
            <input
              style={estilos.campo}
              value={nombresAlcalde}
              onChange={(e) => setNombresAlcalde(e.target.value)}
              required
            />

            <label style={estilos.etiqueta}>Apellidos</label>
            <input
              style={estilos.campo}
              value={apellidosAlcalde}
              onChange={(e) => setApellidosAlcalde(e.target.value)}
              required
            />

            <label style={estilos.etiqueta}>Foto del alcalde</label>
            <div style={{ marginBottom: "12px" }}>
              <VistaPreviaArchivo
                archivo={fotoAlcalde}
                texto="Vista previa del alcalde"
                estilo={estilos.fotoAlcalde}
                ajuste="cover"
              />
            </div>
            <input
              style={estilos.campo}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFotoAlcalde(e.target.files?.[0] || null)
              }
              required
            />

            <button
              style={{
                ...estilos.boton,
                opacity: cargando ? 0.65 : 1,
              }}
              type="submit"
              disabled={cargando}
            >
              {cargando ? "GUARDANDO..." : "GUARDAR LISTA"}
            </button>
          </form>
        </section>

        <section style={estilos.panel}>
          <h2 style={estilos.tituloPanel}>Añadir integrante a una lista</h2>

          <form onSubmit={agregarCandidato}>
            <label style={estilos.etiqueta}>Selecciona la lista</label>
            <select
              style={estilos.campo}
              value={listaElegida}
              onChange={(e) => setListaElegida(e.target.value)}
              required
            >
              <option value="">Seleccionar lista</option>
              {listas.map((lista) => (
                <option key={lista.id} value={lista.id}>
                  Lista {lista.numero} — {lista.nombre}
                </option>
              ))}
            </select>

            <label style={estilos.etiqueta}>Nombres</label>
            <input
              style={estilos.campo}
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              required
            />

            <label style={estilos.etiqueta}>Apellidos</label>
            <input
              style={estilos.campo}
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              required
            />

            <label style={estilos.etiqueta}>Cargo</label>
            <select
              style={estilos.campo}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            >
              <option>Teniente alcalde</option>
              <option>Regidor de educación, cultura y deporte</option>
              <option>Regidor de salud y ambiente</option>
              <option>
                Regidor de emprendimiento y actividades productivas
              </option>
              <option>
                Regidor de derechos del niño, niña y adolescente
              </option>
              <option>Otro cargo</option>
            </select>

            <label style={estilos.etiqueta}>
              Foto del integrante (opcional)
            </label>
            <div style={{ marginBottom: "12px" }}>
              <VistaPreviaArchivo
                archivo={fotoCandidato}
                texto="Vista previa del integrante"
                estilo={estilos.fotoIntegrante}
                ajuste="cover"
              />
            </div>
            <input
              style={estilos.campo}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFotoCandidato(e.target.files?.[0] || null)
              }
            />

            <button
              style={{
                ...estilos.boton,
                opacity: cargando ? 0.65 : 1,
              }}
              type="submit"
              disabled={cargando}
            >
              {cargando ? "GUARDANDO..." : "AÑADIR CANDIDATO"}
            </button>
          </form>
        </section>

        <h2
          style={{
            color: "#173b70",
            fontSize: "25px",
            margin: "32px 0 18px",
          }}
        >
          Listas registradas
        </h2>

        {cargando && <p>Cargando información...</p>}

        {!cargando && listas.length === 0 && (
          <div
            style={{
              ...estilos.panel,
              textAlign: "center",
              color: "#64748b",
            }}
          >
            Aún no hay listas registradas en este colegio.
          </div>
        )}

        {listas.map((lista) => {
          const integrantes = candidatos.filter(
            (candidato) =>
              String(candidato.lista_id) === String(lista.id)
          );

          const alcalde = integrantes.find(
            (candidato) =>
              String(candidato.cargo || "").trim().toLowerCase() ===
              "alcalde escolar"
          );

          const fotoDelAlcalde =
            lista.foto_candidato_url || alcalde?.foto_url || "";

          return (
            <section
              key={lista.id}
              style={{
                ...estilos.tarjetaLista,
                borderTop: `5px solid ${lista.color || "#1d4ed8"}`,
              }}
            >
              <div style={estilos.cabeceraLista}>
                <div>
                  <label style={estilos.etiqueta}>Logo de campaña</label>
                  <ImagenConRespaldo
                    src={lista.logo_url}
                    alt={`Logo de ${lista.nombre}`}
                    texto="Logo no disponible"
                    estilo={estilos.logo}
                  />
                </div>

                <div style={{ flex: "1 1 200px", minWidth: 0 }}>
                  <h2
                    style={{
                      color: "#173b70",
                      fontSize: "22px",
                      overflowWrap: "anywhere",
                      margin: "0 0 12px",
                    }}
                  >
                    Lista {lista.numero}: {lista.nombre}
                  </h2>
                  <p style={{ color: "#475569", lineHeight: 1.6 }}>
                    <strong>Candidato a alcalde:</strong>{" "}
                    {lista.candidato || "Sin registrar"}
                  </p>
                </div>

                <div>
                  <label style={estilos.etiqueta}>Foto del alcalde</label>
                  <ImagenConRespaldo
                    src={fotoDelAlcalde}
                    alt={`Candidato de ${lista.nombre}`}
                    texto="Foto no disponible"
                    estilo={estilos.fotoAlcalde}
                    ajuste="cover"
                  />
                </div>
              </div>

              <div style={estilos.seccionIntegrantes}>
                <h3 style={{ color: "#173b70", margin: "0 0 10px" }}>
                  Integrantes y cargos
                </h3>

                {integrantes.length === 0 && (
                  <p style={{ color: "#64748b" }}>
                    No hay integrantes registrados en esta lista.
                  </p>
                )}

                {integrantes.map((candidato) => (
                  <div key={candidato.id} style={estilos.integrante}>
                    <ImagenConRespaldo
                      src={candidato.foto_url}
                      alt={`${candidato.nombres} ${candidato.apellidos}`}
                      texto="Sin foto"
                      estilo={estilos.fotoIntegrante}
                      ajuste="cover"
                    />

                    <div style={{ minWidth: 0 }}>
                      <strong style={{ color: "#1e293b" }}>
                        {candidato.nombres} {candidato.apellidos}
                      </strong>
                      <div
                        style={{
                          marginTop: "5px",
                          color: "#64748b",
                          fontSize: "14px",
                        }}
                      >
                        {candidato.cargo}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}

        <button
          style={estilos.botonVolver}
          type="button"
          onClick={volver}
        >
          ← VOLVER
  
        </button>
      </main>
    </div>
  );
}

export default ListasCandidatos;
