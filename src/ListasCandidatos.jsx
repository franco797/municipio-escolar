
import { useEffect, useState } from "react";

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

  useEffect(() => {
    cargarListas();
  }, [colegio?.id]);

  const subirFoto = async (archivo, carpeta) => {
    if (!archivo) return null;

    if (!archivo.type.startsWith("image/")) {
      throw new Error("Selecciona un archivo de imagen válido.");
    }

    if (archivo.size > 5 * 1024 * 1024) {
      throw new Error("Cada imagen debe pesar máximo 5 MB.");
    }

    const extension = archivo.name.split(".").pop().toLowerCase();
    const ruta = `${colegio.id}/${carpeta}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${extension}`;

    const { error: errorSubida } = await supabase.storage
      .from("listas-fotos")
      .upload(ruta, archivo, {
        upsert: false,
        contentType: archivo.type,
      });

    if (errorSubida) throw errorSubida;

    const { data } = supabase.storage
      .from("listas-fotos")
      .getPublicUrl(ruta);

    return data.publicUrl;
  };

  const cargarListas = async () => {
    if (!colegio?.id) return;

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
      console.error(e);
      setError("No se pudieron cargar las listas: " + e.message);
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
      console.error(e);
      setError(e.message || "No se pudo registrar la lista.");
    } finally {
      setCargando(false);
    }
  };

  const agregarCandidato = async (evento) => {
    evento.preventDefault();
    setMensaje("");
    setError("");

    if (!listaElegida) {
      setError("Selecciona una lista.");
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

      setMensaje("Candidato agregado correctamente.");
      await cargarListas();
    } catch (e) {
      console.error(e);
      setError(e.message || "No se pudo agregar el candidato.");
    } finally {
      setCargando(false);
    }
  };

  const panel = {
    background: "#fff",
    border: "1px solid #dbe2ea",
    borderRadius: "12px",
    padding: "20px",
    marginBottom: "22px",
    textAlign: "left",
  };

  const campo = {
    width: "100%",
    padding: "10px",
    marginTop: "6px",
    marginBottom: "14px",
    border: "1px solid #cbd5e1",
    borderRadius: "7px",
    boxSizing: "border-box",
  };

  const boton = {
    padding: "11px 16px",
    border: "none",
    borderRadius: "7px",
    background: "#1d4ed8",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f3f6fa",
        padding: "24px 12px",
        boxSizing: "border-box",
      }}
    >
      <main
        style={{
          maxWidth: "1000px",
          margin: "0 auto",
          fontFamily: "Arial, sans-serif",
          color: "#243247",
        }}
      >
        <h1>Listas y candidatos</h1>
        <p>{colegio?.nombre}</p>

        {mensaje && (
          <p style={{ color: "#15803d", fontWeight: "bold" }}>
            {mensaje}
          </p>
        )}

        {error && (
          <p style={{ color: "#b91c1c", fontWeight: "bold" }}>
            {error}
          </p>
        )}

        <section style={panel}>
          <h2>Registrar nueva lista</h2>

          <form onSubmit={registrarLista}>
            <label>Número de lista</label>
            <input
              style={campo}
              type="number"
              min="1"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              required
            />

            <label>Nombre de la lista o partido</label>
            <input
              style={campo}
              value={nombreLista}
              onChange={(e) => setNombreLista(e.target.value)}
              placeholder="Ej. Unidos por nuestro colegio"
              required
            />

            <label>Color de la lista</label>
            <input
              style={{ ...campo, height: "45px" }}
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
            />

            <label>Logo de la lista</label>
            <input
              style={campo}
              type="file"
              accept="image/*"
              onChange={(e) => setLogo(e.target.files?.[0] || null)}
              required
            />

            <h3>Candidato a alcalde escolar</h3>

            <label>Nombres</label>
            <input
              style={campo}
              value={nombresAlcalde}
              onChange={(e) => setNombresAlcalde(e.target.value)}
              required
            />

            <label>Apellidos</label>
            <input
              style={campo}
              value={apellidosAlcalde}
              onChange={(e) => setApellidosAlcalde(e.target.value)}
              required
            />

            <label>Foto del candidato a alcalde</label>
            <input
              style={campo}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFotoAlcalde(e.target.files?.[0] || null)
              }
              required
            />

            <button style={boton} type="submit" disabled={cargando}>
              {cargando ? "GUARDANDO..." : "GUARDAR LISTA"}
            </button>
          </form>
        </section>

        <section style={panel}>
          <h2>Añadir integrante a una lista</h2>

          <form onSubmit={agregarCandidato}>
            <label>Selecciona la lista</label>
            <select
              style={campo}
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

            <label>Nombres</label>
            <input
              style={campo}
              value={nombres}
              onChange={(e) => setNombres(e.target.value)}
              required
            />

            <label>Apellidos</label>
            <input
              style={campo}
              value={apellidos}
              onChange={(e) => setApellidos(e.target.value)}
              required
            />

            <label>Cargo</label>
            <select
              style={campo}
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
            >
              <option>Teniente alcalde</option>
              <option>Regidor de educación, cultura y deporte</option>
              <option>Regidor de salud y ambiente</option>
              <option>Regidor de emprendimiento y actividades productivas</option>
              <option>Regidor de derechos del niño, niña y adolescente</option>
              <option>Otro cargo</option>
            </select>

            <label>Foto del integrante (opcional)</label>
            <input
              style={campo}
              type="file"
              accept="image/*"
              onChange={(e) =>
                setFotoCandidato(e.target.files?.[0] || null)
              }
            />

            <button style={boton} type="submit" disabled={cargando}>
              AÑADIR CANDIDATO
            </button>
          </form>
        </section>

        <h2>Listas registradas</h2>

        {cargando && <p>Cargando información...</p>}

        {!cargando && listas.length === 0 && (
          <p>Aún no hay listas registradas en este colegio.</p>
        )}

        {listas.map((lista) => (
          <section
            key={lista.id}
            style={{
              ...panel,
              borderTop: `5px solid ${lista.color || "#1d4ed8"}`,
            }}
          >
            <div
              style={{
                display: "flex",
                gap: "18px",
                alignItems: "center",
                flexWrap: "wrap",
              }}
            >
              {lista.logo_url && (
                <img
                  src={lista.logo_url}
                  alt={`Logo de ${lista.nombre}`}
                  style={{
                    width: "90px",
                    height: "90px",
                    objectFit: "contain",
                  }}
                />
              )}

              <div>
                <h2>
                  Lista {lista.numero}: {lista.nombre}
                </h2>
                <p>
                  <strong>Candidato a alcalde:</strong>{" "}
                  {lista.candidato || "Sin registrar"}
                </p>
              </div>

              {lista.foto_candidato_url && (
                <img
                  src={lista.foto_candidato_url}
                  alt={`Candidato de ${lista.nombre}`}
                  style={{
                    width: "90px",
                    height: "100px",
                    objectFit: "cover",
                    borderRadius: "8px",
                  }}
                />
              )}
            </div>

            <h3>Integrantes y cargos</h3>

            {candidatos
              .filter((candidato) => candidato.lista_id === lista.id)
              .map((candidato) => (
                <div
                  key={candidato.id}
                  style={{
                    display: "flex",
                    gap: "12px",
                    alignItems: "center",
                    borderTop: "1px solid #e2e8f0",
                    padding: "10px 0",
                  }}
                >
                  {candidato.foto_url && (
                    <img
                      src={candidato.foto_url}
                      alt={`${candidato.nombres} ${candidato.apellidos}`}
                      style={{
                        width: "55px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "6px",
                      }}
                    />
                  )}

                  <div>
                    <strong>
                      {candidato.nombres} {candidato.apellidos}
                    </strong>
                    <div>{candidato.cargo}</div>
                  </div>
                </div>
              ))}
          </section>
        ))}

        <button
          style={{
            ...boton,
            background: "#64748b",
            marginTop: "10px",
          }}
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
