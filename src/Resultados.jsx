
import { useEffect, useState } from "react";
import "./Admin.css";

const colores = ["#1685c5", "#159570", "#e09b26", "#805ad5", "#d94f70"];

function Resultados({ supabase, colegio, volver }) {
  const [listas, setListas] = useState([]);
  const [totalVotos, setTotalVotos] = useState(0);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let activo = true;

    const cargarResultados = async (mostrarCarga = false) => {
      if (mostrarCarga && activo) setCargando(true);

      try {
        if (!colegio?.id) {
          throw new Error("No se ha seleccionado un colegio.");
        }

        const [
          { data: listasData, error: errorListas },
          { data: votosData, error: errorVotos },
          { count, error: errorEstudiantes },
        ] = await Promise.all([
          supabase
            .from("listas")
            .select("*")
            .eq("colegio_id", colegio.id)
            .order("numero", { ascending: true }),

          supabase
            .from("votos")
            .select("lista_id")
            .eq("colegio_id", colegio.id),

          supabase
            .from("estudiantes")
            .select("id", { count: "exact", head: true })
            .eq("colegio_id", colegio.id),
        ]);

        if (errorListas) throw errorListas;
        if (errorVotos) throw errorVotos;
        if (errorEstudiantes) throw errorEstudiantes;

        const votos = votosData || [];

        const listasConVotos = (listasData || []).map(
          (lista, indice) => ({
            ...lista,
            cantidadVotos: votos.filter(
              (voto) => String(voto.lista_id) === String(lista.id)
            ).length,
            color: colores[indice % colores.length],
          })
        );

        if (activo) {
          setListas(listasConVotos);
          setTotalVotos(votos.length);
          setTotalEstudiantes(count || 0);
          setError("");
        }
      } catch (err) {
        console.error("ERROR AL CARGAR RESULTADOS:", err);

        if (activo) {
          setError(
            err.message || "No se pudieron cargar los resultados."
          );
        }
      } finally {
        if (activo) setCargando(false);
      }
    };

    cargarResultados(true);

    const intervalo = window.setInterval(() => {
      cargarResultados();
    }, 5000);

    return () => {
      activo = false;
      window.clearInterval(intervalo);
    };
  }, [supabase, colegio?.id]);

  const participacion =
    totalEstudiantes > 0
      ? Math.min((totalVotos / totalEstudiantes) * 100, 100)
      : 0;

  const estudiantesSinVotar = Math.max(
    totalEstudiantes - totalVotos,
    0
  );

  const porcentaje = (cantidad) =>
    totalVotos > 0
      ? ((cantidad / totalVotos) * 100).toFixed(1)
      : "0.0";

  const listasOrdenadas = [...listas].sort(
    (a, b) => b.cantidadVotos - a.cantidadVotos
  );

  const maxVotos = listasOrdenadas[0]?.cantidadVotos ?? 0;

  const ganadores =
    maxVotos > 0
      ? listasOrdenadas.filter(
          (lista) => lista.cantidadVotos === maxVotos
        )
      : [];

  const fechaInforme = new Date().toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const tarjeta = {
    background: "#ffffff",
    border: "1px solid #dcecf5",
    borderRadius: "16px",
    padding: "20px",
    minWidth: 0,
    boxShadow: "0 5px 18px rgba(31, 100, 140, 0.07)",
  };

  const descargarPDF = () => {
    window.print();
  };

  const nombreLista = (lista, indice) =>
    `Lista ${lista.numero ?? indice + 1}${
      lista.nombre ? ` - ${lista.nombre}` : ""
    }`;

  return (
    <div
      className="admin-container resultados-pagina"
      style={{
        background: "#f0f8fd",
        padding: "24px 14px",
        alignItems: "flex-start",
        minHeight: "100vh",
      }}
    >
      <style>{`
        @page {
          size: A4;
          margin: 12mm;
        }

        @media print {
          body {
            background: white !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          body * {
            visibility: hidden;
          }

          .resultados-pagina,
          .resultados-pagina * {
            visibility: visible;
          }

          .resultados-pagina {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            background: white !important;
            display: block !important;
          }

          .resultados-contenido {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            font-family: Arial, sans-serif !important;
          }

          .resultados-no-imprimir {
            display: none !important;
          }

          .resultados-cabecera {
            border-radius: 10px !important;
            padding: 18px !important;
            margin-bottom: 12px !important;
          }

          .resultados-indicadores {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 7px !important;
            margin-bottom: 12px !important;
          }

          .resultados-indicadores > div {
            padding: 10px !important;
            box-shadow: none !important;
            break-inside: avoid;
          }

          .resultados-indicadores p:first-child {
            font-size: 9px !important;
          }

          .resultados-indicadores p:nth-child(2) {
            font-size: 19px !important;
          }

          .resultados-seccion {
            padding: 13px !important;
            margin-bottom: 12px !important;
            box-shadow: none !important;
          }

          .resultados-fila-lista {
            break-inside: avoid;
          }

          .resultados-tabla {
            width: 100% !important;
            font-size: 11px !important;
          }

          .resultados-tabla th,
          .resultados-tabla td {
            padding: 7px !important;
          }

          .resultados-pie {
            text-align: center !important;
            font-size: 10px !important;
            margin-top: 12px !important;
          }
        }
      `}</style>

      <div
        className="resultados-contenido"
        style={{
          width: "100%",
          maxWidth: "1000px",
          margin: "0 auto",
          color: "#17324d",
          fontFamily: "Arial, sans-serif",
        }}
      >
        <header
          className="resultados-cabecera"
          style={{
            background: "linear-gradient(135deg, #dff3ff, #b8e4fa)",
            color: "#12466c",
            border: "1px solid #b4def3",
            borderRadius: "18px",
            padding: "26px",
            marginBottom: "20px",
            boxShadow: "0 6px 18px rgba(39, 126, 171, 0.10)",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "#ffffff",
              color: "#1673a8",
              borderRadius: "7px",
              padding: "7px 11px",
              fontSize: "11px",
              fontWeight: "800",
              letterSpacing: "1.5px",
              marginBottom: "12px",
            }}
          >
            MUNICIPIO ESCOLAR
          </div>

          <p
            style={{
              margin: "0 0 5px",
              fontSize: "12px",
              fontWeight: "700",
              color: "#326e91",
              letterSpacing: "1px",
            }}
          >
            SISTEMA ELECTORAL ESCOLAR
          </p>

          <h1
            style={{
              fontSize: "clamp(25px, 4vw, 34px)",
              lineHeight: 1.2,
              margin: "7px 0 12px",
              color: "#123f60",
            }}
          >
            Resultados electorales
          </h1>

          <div
            style={{
              width: "65px",
              height: "4px",
              background: "#2596cf",
              borderRadius: "5px",
              marginBottom: "13px",
            }}
          />

          <p
            style={{
              fontSize: "16px",
              fontWeight: "700",
              margin: "0 0 6px",
              color: "#194e70",
            }}
          >
            {colegio?.nombre || "Colegio seleccionado"}
          </p>

          <p style={{ margin: 0, fontSize: "12px", color: "#386985" }}>
            Informe generado el {fechaInforme}
          </p>
        </header>

        {cargando && (
          <div style={tarjeta}>Cargando resultados electorales...</div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              ...tarjeta,
              color: "#a52323",
              background: "#fff5f5",
              borderColor: "#fecaca",
            }}
          >
            <strong>No se pudieron cargar los resultados.</strong>
            <p>{error}</p>
          </div>
        )}

        {!cargando && !error && (
          <>
            <div
              className="resultados-indicadores"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(190px, 1fr))",
                gap: "14px",
                marginBottom: "22px",
              }}
            >
              {[
                {
                  titulo: "Estudiantes registrados",
                  valor: totalEstudiantes,
                  detalle: "Total del colegio",
                  color: "#1976b9",
                  fondo: "#e5f4ff",
                  icono: "👨‍🎓",
                },
                {
                  titulo: "Votos emitidos",
                  valor: totalVotos,
                  detalle: "Votos registrados",
                  color: "#14835e",
                  fondo: "#e3f8ee",
                  icono: "🗳️",
                },
                {
                  titulo: "Participación",
                  valor: `${participacion.toFixed(1)}%`,
                  detalle: "Participación electoral",
                  color: "#805ad5",
                  fondo: "#f0eaff",
                  icono: "📊",
                },
                {
                  titulo: "Pendientes",
                  valor: estudiantesSinVotar,
                  detalle: "Aún no han votado",
                  color: "#c47716",
                  fondo: "#fff3dd",
                  icono: "⏳",
                },
              ].map((item) => (
                <div
                  key={item.titulo}
                  style={{
                    ...tarjeta,
                    borderTop: `4px solid ${item.color}`,
                    padding: "18px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      marginBottom: "13px",
                    }}
                  >
                    <div
                      style={{
                        width: "38px",
                        height: "38px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: item.fondo,
                        borderRadius: "11px",
                        fontSize: "19px",
                      }}
                    >
                      {item.icono}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color: "#547086",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      {item.titulo}
                    </p>
                  </div>

                  <p
                    style={{
                      color: item.color,
                      fontSize: "30px",
                      fontWeight: "800",
                      margin: "0 0 5px",
                    }}
                  >
                    {item.valor}
                  </p>

                  <p style={{ color: "#7b8e9e", fontSize: "12px", margin: 0 }}>
                    {item.detalle}
                  </p>

                  {item.titulo === "Participación" && (
                    <div
                      style={{
                        height: "6px",
                        background: "#e6edf3",
                        borderRadius: "10px",
                        overflow: "hidden",
                        marginTop: "13px",
                      }}
                    >
                      <div
                        style={{
                          width: `${participacion}%`,
                          height: "100%",
                          background: item.color,
                          borderRadius: "10px",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            <section
              className="resultados-seccion"
              style={{
                ...tarjeta,
                padding: "clamp(16px, 3vw, 27px)",
                marginBottom: "20px",
              }}
            >
              <div style={{ marginBottom: "25px" }}>
                <h2
                  style={{
                    color: "#164d70",
                    fontSize: "22px",
                    margin: "0 0 7px",
                  }}
                >
                  Resultados por lista
                </h2>
                <p style={{ color: "#6d8598", fontSize: "13px", margin: 0 }}>
                  Porcentaje de votos por lista, de mayor a menor resultado.
                </p>
              </div>

              {listasOrdenadas.length === 0 ? (
                <p>No hay listas registradas en este colegio.</p>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
                  {listasOrdenadas.map((lista, indice) => {
                    const porc = Number(porcentaje(lista.cantidadVotos));
                    const color = colores[indice % colores.length];

                    return (
                      <div className="resultados-fila-lista" key={lista.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "9px",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "11px",
                              minWidth: 0,
                            }}
                          >
                            <div
                              style={{
                                width: "42px",
                                height: "42px",
                                flexShrink: 0,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                background: color,
                                color: "#ffffff",
                                borderRadius: "12px",
                                fontWeight: "800",
                                fontSize: "16px",
                                boxShadow: `0 3px 8px ${color}30`,
                              }}
                            >
                              {lista.numero ?? indice + 1}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <p
                                style={{
                                  color: "#24465f",
                                  fontWeight: "700",
                                  margin: 0,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {nombreLista(lista, indice)}
                              </p>

                              {lista.candidato && (
                                <p
                                  style={{
                                    color: "#8293a2",
                                    fontSize: "12px",
                                    margin: "4px 0 0",
                                  }}
                                >
                                  {lista.candidato}
                                </p>
                              )}
                            </div>
                          </div>

                          <strong
                            style={{
                              color,
                              fontSize: "21px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {porc.toFixed(1)}%
                          </strong>
                        </div>

                        <div
                          style={{
                            height: "15px",
                            width: "100%",
                            background: "#edf3f7",
                            borderRadius: "10px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            role="img"
                            aria-label={`${nombreLista(lista, indice)}: ${porc}%`}
                            style={{
                              width: `${porc}%`,
                              minWidth: lista.cantidadVotos > 0 ? "4px" : "0",
                              height: "100%",
                              background: `linear-gradient(90deg, ${color}, ${color}cc)`,
                              borderRadius: "10px",
                              transition: "width 0.4s ease",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p
                style={{
                  fontSize: "12px",
                  color: "#8093a2",
                  margin: "24px 0 0",
                }}
              >
                Los porcentajes se calculan sobre el total de votos registrados.
              </p>
            </section>

            <section
              className="resultados-seccion"
              style={{ ...tarjeta, marginBottom: "20px" }}
            >
              <h2
                style={{
                  color: "#164d70",
                  fontSize: "21px",
                  margin: "0 0 16px",
                }}
              >
                Resumen electoral
              </h2>

              <div style={{ overflowX: "auto" }}>
                <table
                  className="resultados-tabla"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    fontSize: "14px",
                  }}
                >
                  <thead>
                    <tr style={{ background: "#e8f5fc", color: "#245571" }}>
                      <th style={{ padding: "13px 10px" }}>Lista</th>
                      <th style={{ padding: "13px 10px" }}>Votos</th>
                      <th style={{ padding: "13px 10px" }}>Porcentaje</th>
                    </tr>
                  </thead>

                  <tbody>
                    {listasOrdenadas.map((lista, indice) => (
                      <tr
                        key={lista.id}
                        style={{ borderBottom: "1px solid #e5edf3" }}
                      >
                        <td style={{ padding: "13px 10px", color: "#34556b" }}>
                          {nombreLista(lista, indice)}
                        </td>
                        <td style={{ padding: "13px 10px", fontWeight: "700" }}>
                          {lista.cantidadVotos}
                        </td>
                        <td style={{ padding: "13px 10px", color: "#1679ae", fontWeight: "700" }}>
                          {porcentaje(lista.cantidadVotos)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section
              className="resultados-seccion"
              style={{
                ...tarjeta,
                marginBottom: "20px",
                border: "1px solid #b8dff3",
                background: "linear-gradient(135deg, #ffffff, #f0f9ff)",
                padding: "clamp(18px, 3vw, 27px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "11px",
                  marginBottom: "18px",
                }}
              >
                <div
                  style={{
                    width: "43px",
                    height: "43px",
                    background: "#dff2ff",
                    borderRadius: "12px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                  }}
                >
                  🏆
                </div>

                <div>
                  <h2 style={{ color: "#164d70", fontSize: "21px", margin: 0 }}>
                    Resultado final
                  </h2>
                  <p style={{ color: "#7690a3", fontSize: "12px", margin: "4px 0 0" }}>
                    Resultado según los votos registrados
                  </p>
                </div>
              </div>

              {ganadores.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    background: "#fff8e8",
                    color: "#95621c",
                    borderRadius: "10px",
                  }}
                >
                  Todavía no hay votos registrados. Aún no se puede declarar un ganador.
                </div>
              ) : ganadores.length > 1 ? (
                <>
                  <div
                    style={{
                      display: "inline-block",
                      background: "#fff0cc",
                      color: "#8a5b10",
                      padding: "7px 12px",
                      borderRadius: "7px",
                      fontWeight: "800",
                      fontSize: "12px",
                      marginBottom: "14px",
                    }}
                  >
                    EMPATE ELECTORAL
                  </div>

                  <p style={{ color: "#47647a", margin: "0 0 15px" }}>
                    Las siguientes listas obtuvieron la misma cantidad de votos:
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {ganadores.map((lista) => (
                      <div
                        key={lista.id}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #b8dff3",
                          borderRadius: "12px",
                          padding: "17px",
                          borderTop: "4px solid #2496ca",
                        }}
                      >
                        <p
                          style={{
                            color: "#164d70",
                            fontSize: "16px",
                            fontWeight: "800",
                            margin: "0 0 10px",
                          }}
                        >
                          Lista {lista.numero}
                          {lista.nombre ? ` - ${lista.nombre}` : ""}
                        </p>

                        <p style={{ color: "#197caf", fontSize: "24px", fontWeight: "800", margin: 0 }}>
                          {lista.cantidadVotos} votos
                        </p>

                        <p style={{ color: "#70899b", fontSize: "13px", margin: "5px 0 0" }}>
                          {porcentaje(lista.cantidadVotos)}% de los votos
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #b8dff3",
                    borderRadius: "12px",
                    padding: "20px",
                    borderLeft: "5px solid #159570",
                  }}
                >
                  <p style={{ color: "#648094", fontSize: "13px", margin: "0 0 8px" }}>
                    LISTA CON MAYOR CANTIDAD DE VOTOS
                  </p>

                  <h3 style={{ color: "#164d70", fontSize: "23px", margin: "0 0 10px" }}>
                    {nombreLista(ganadores[0], listasOrdenadas.indexOf(ganadores[0]))}
                  </h3>

                  {ganadores[0].candidato && (
                    <p style={{ color: "#648094", margin: "0 0 12px" }}>
                      Candidato: {ganadores[0].candidato}
                    </p>
                  )}

                  <p style={{ color: "#159570", fontSize: "19px", fontWeight: "800", margin: 0 }}>
                    {ganadores[0].cantidadVotos} votos · {porcentaje(ganadores[0].cantidadVotos)}%
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        <div
          className="resultados-no-imprimir"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "12px",
            marginBottom: "25px",
          }}
        >
          <button
            type="button"
            onClick={descargarPDF}
            disabled={cargando || Boolean(error)}
            style={{
              background: "#1979ad",
              color: "#ffffff",
              border: "none",
              borderRadius: "9px",
              padding: "14px 20px",
              fontWeight: "800",
              cursor: "pointer",
              boxShadow: "0 4px 10px rgba(25, 121, 173, 0.18)",
            }}
          >
            DESCARGAR INFORME PDF
          </button>

          <button
            type="button"
            className="admin-btn-back"
            onClick={volver}
          >
            ← VOLVER AL MENÚ
          </button>
        </div>

        <p
          className="resultados-pie"
          style={{
            textAlign: "center",
            fontSize: "12px",
            color: "#8195a5",
            padding: "12px 0",
          }}
        >
          Municipio Escolar · Informe oficial de resultados electorales
        </p>
      </div>
    </div>
  );
}

export default Resultados;
