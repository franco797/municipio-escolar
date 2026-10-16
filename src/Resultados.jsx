

import { useEffect, useState } from "react";
import "./Admin.css";

const COLOR = "#527A99";
const COLOR_OSCURO = "#365B78";
const COLOR_CLARO = "#EAF1F6";
const FONDO = "#F5F7F9";
const TEXTO = "#354555";
const TEXTO_SECUNDARIO = "#718096";
const BORDE = "#DFE6EC";

function Resultados({ supabase, colegio, volver }) {
  const [listas, setListas] = useState([]);
  const [totalVotos, setTotalVotos] = useState(0);
  const [totalEstudiantes, setTotalEstudiantes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [fechaInforme, setFechaInforme] = useState(new Date());

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

        const listasConVotos = (listasData || []).map((lista) => ({
          ...lista,
          cantidadVotos: votos.filter(
            (voto) => String(voto.lista_id) === String(lista.id)
          ).length,
          color: COLOR,
        }));

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

  const fechaTexto = fechaInforme.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const horaTexto = fechaInforme.toLocaleTimeString("es-PE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  const obtenerLogoLista = (lista) =>
    lista.logo_url ||
    lista.logo_campana_url ||
    lista.logo_campaña_url ||
    lista.imagen_url ||
    lista.foto_url ||
    lista.logo ||
    lista.imagen ||
    "";

  const nombreLista = (lista, indice) =>
    `Lista ${lista.numero ?? indice + 1}${
      lista.nombre ? ` - ${lista.nombre}` : ""
    }`;

  const imprimirPDF = () => {
    setFechaInforme(new Date());
    window.setTimeout(() => window.print(), 150);
  };

  const tarjeta = {
    background: "#FFFFFF",
    border: `1px solid ${BORDE}`,
    borderRadius: "12px",
    padding: "21px",
    minWidth: 0,
    boxShadow: "0 2px 8px rgba(53,69,85,0.035)",
  };

  const tituloSeccion = {
    color: COLOR_OSCURO,
    fontSize: "20px",
    fontWeight: "750",
    letterSpacing: "-0.3px",
    margin: "0 0 7px",
  };

  const textoSecundario = {
    color: TEXTO_SECUNDARIO,
    fontSize: "13px",
    lineHeight: 1.6,
    margin: 0,
  };

  const etiquetaSeccion = {
    color: COLOR,
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "1.4px",
    marginBottom: "7px",
  };

  return (
    <div
      className="admin-container resultados-pagina"
      style={{
        background: FONDO,
        padding: "26px 16px",
        alignItems: "flex-start",
        minHeight: "100vh",
        boxSizing: "border-box",
      }}
    >
      <style>{`
        .resultados-pagina,
        .resultados-pagina * {
          box-sizing: border-box;
        }

        .resultados-pagina button {
          font-family: inherit;
          transition: background .18s ease;
        }

        .resultados-cabecera {
          background: ${COLOR_CLARO};
          color: ${COLOR_OSCURO};
          border: 1px solid #D8E3EB;
          border-radius: 14px;
          padding: 26px;
          margin-bottom: 18px;
          break-inside: avoid;
        }

        .resultados-sello {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 50px;
          height: 50px;
          border-radius: 10px;
          background: #FFFFFF;
          border: 1px solid #D8E3EB;
          font-size: 26px;
          flex-shrink: 0;
        }

        .resultados-insignia {
          width: 70px;
          height: 70px;
          object-fit: contain;
          background: #FFFFFF;
          border-radius: 10px;
          padding: 5px;
          border: 1px solid ${BORDE};
          flex-shrink: 0;
        }

        .resultados-indicadores {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px;
          margin-bottom: 18px;
        }

        .resultados-indicador {
          background: #FFFFFF;
          border: 1px solid ${BORDE};
          border-top: 3px solid ${COLOR};
          border-radius: 12px;
          padding: 18px;
          min-width: 0;
          break-inside: avoid;
        }

        .resultados-seccion {
          background: #FFFFFF;
          border: 1px solid ${BORDE};
          border-radius: 13px;
          padding: 24px;
          margin-bottom: 18px;
          break-inside: auto;
        }

        .resultados-fila-lista {
          break-inside: avoid;
        }

        .resultados-logo-lista {
          width: 46px;
          height: 46px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          border-radius: 9px;
          overflow: hidden;
          background: ${COLOR_CLARO};
          border: 1px solid #D8E3EB;
        }

        .resultados-logo-lista img {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #FFFFFF;
          padding: 3px;
        }

        .resultados-tabla th {
          background: ${COLOR_CLARO};
          color: ${COLOR_OSCURO};
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: .5px;
          font-weight: 800;
          text-align: left;
        }

        .resultados-tabla th,
        .resultados-tabla td {
          padding: 13px 12px;
          border-bottom: 1px solid #E8EDF1;
        }

        .resultados-tabla tbody tr:last-child td {
          border-bottom: none;
        }

        .resultados-pie {
          text-align: center;
          color: ${TEXTO_SECUNDARIO};
          font-size: 11px;
          line-height: 1.7;
          padding: 14px 0;
        }

        @media (max-width: 760px) {
          .resultados-indicadores {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .resultados-cabecera {
            padding: 19px;
          }

          .resultados-seccion {
            padding: 17px;
          }
        }

        @media (max-width: 420px) {
          .resultados-indicador {
            padding: 12px;
          }

          .resultados-indicador-valor {
            font-size: 25px !important;
          }

          .resultados-insignia {
            width: 55px;
            height: 55px;
          }
        }

        @page {
          size: A4;
          margin: 11mm;
        }

        @media print {
          html, body, #root {
            background: #FFFFFF !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
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
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #FFFFFF !important;
            display: block !important;
          }

          .resultados-contenido {
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            color: ${TEXTO} !important;
            font-family: Arial, Helvetica, sans-serif !important;
          }

          .resultados-no-imprimir {
            display: none !important;
          }

          .resultados-cabecera {
            padding: 16px !important;
            margin-bottom: 10px !important;
            border-radius: 8px !important;
            background: ${COLOR_CLARO} !important;
            color: ${COLOR_OSCURO} !important;
            box-shadow: none !important;
            break-inside: avoid !important;
          }

          .resultados-cabecera h1 {
            font-size: 24px !important;
            color: ${COLOR_OSCURO} !important;
          }

          .resultados-indicadores {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
            gap: 7px !important;
            margin-bottom: 10px !important;
          }

          .resultados-indicador {
            padding: 10px !important;
            border-radius: 7px !important;
            box-shadow: none !important;
            break-inside: avoid !important;
          }

          .resultados-indicador-valor {
            font-size: 20px !important;
          }

          .resultados-seccion {
            padding: 13px !important;
            margin-bottom: 10px !important;
            border-radius: 8px !important;
            box-shadow: none !important;
          }

          .resultados-seccion h2 {
            font-size: 16px !important;
          }

          .resultados-fila-lista {
            break-inside: avoid !important;
          }

          .resultados-logo-lista {
            width: 34px !important;
            height: 34px !important;
          }

          .resultados-tabla {
            width: 100% !important;
            font-size: 10px !important;
          }

          .resultados-tabla th,
          .resultados-tabla td {
            padding: 7px !important;
          }

          .resultados-pie {
            font-size: 9px !important;
          }

          .resultados-cabecera,
          .resultados-indicador,
          .resultados-seccion {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
        }
      `}</style>

      <div
        className="resultados-contenido"
        style={{
          width: "100%",
          maxWidth: "1050px",
          margin: "0 auto",
          color: TEXTO,
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* ENCABEZADO INSTITUCIONAL */}
        <header className="resultados-cabecera">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
              marginBottom: "23px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div className="resultados-sello" aria-label="Urna electoral">
                🗳️
              </div>

              <div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: "800",
                    letterSpacing: ".5px",
                    lineHeight: 1.5,
                    color: COLOR_OSCURO,
                  }}
                >
                  MUNICIPIO ESCOLAR
                </div>

                <div
                  style={{
                    fontSize: "11px",
                    color: COLOR,
                    letterSpacing: "1px",
                    fontWeight: "700",
                  }}
                >
                  ELECCIONES ESCOLARES
                </div>
              </div>
            </div>

            {colegio?.insignia_url && (
              <img
                className="resultados-insignia"
                src={colegio.insignia_url}
                alt="Insignia del colegio"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
            )}
          </div>

          <div
            style={{
              color: COLOR,
              fontSize: "10px",
              fontWeight: "800",
              letterSpacing: "1.3px",
              textTransform: "uppercase",
            }}
          >
            Informe oficial · Resultados electorales
          </div>

          <h1
            style={{
              fontSize: "clamp(26px, 4vw, 34px)",
              lineHeight: 1.2,
              letterSpacing: "-.6px",
              margin: "9px 0 15px",
              color: COLOR_OSCURO,
            }}
          >
            Resultados electorales
          </h1>

          <div
            style={{
              width: "48px",
              height: "3px",
              background: COLOR,
              borderRadius: "3px",
              marginBottom: "15px",
            }}
          />

          <p
            style={{
              fontSize: "16px",
              fontWeight: "700",
              margin: "0 0 9px",
              color: COLOR_OSCURO,
            }}
          >
            {colegio?.nombre || "Colegio seleccionado"}
          </p>

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "7px 18px",
              fontSize: "12px",
              color: TEXTO_SECUNDARIO,
            }}
          >
            <span>Informe general</span>
            <span>Fecha: {fechaTexto}</span>
            <span>Hora: {horaTexto}</span>
          </div>
        </header>

        {cargando && (
          <div style={tarjeta}>Cargando resultados electorales...</div>
        )}

        {error && (
          <div
            role="alert"
            style={{
              ...tarjeta,
              color: "#A33A3A",
              background: "#FFFFFF",
            }}
          >
            <strong>No se pudieron cargar los resultados.</strong>
            <p>{error}</p>
          </div>
        )}

        {!cargando && !error && (
          <>
            {/* CUATRO INDICADORES: UN SOLO COLOR */}
            <div className="resultados-indicadores">
              {[
                {
                  titulo: "Estudiantes registrados",
                  valor: totalEstudiantes,
                  detalle: "Total del colegio",
                  icono: "♟",
                },
                {
                  titulo: "Votos emitidos",
                  valor: totalVotos,
                  detalle: "Votos registrados",
                  icono: "✓",
                },
                {
                  titulo: "Participación",
                  valor: `${participacion.toFixed(1)}%`,
                  detalle: "Participación electoral",
                  icono: "%",
                },
                {
                  titulo: "Pendientes",
                  valor: estudiantesSinVotar,
                  detalle: "Aún no han votado",
                  icono: "…",
                },
              ].map((item) => (
                <div key={item.titulo} className="resultados-indicador">
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      marginBottom: "14px",
                    }}
                  >
                    <div
                      style={{
                        width: "34px",
                        height: "34px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        background: COLOR_CLARO,
                        color: COLOR,
                        borderRadius: "8px",
                        fontSize: "18px",
                        fontWeight: "800",
                        flexShrink: 0,
                      }}
                    >
                      {item.icono}
                    </div>

                    <p
                      style={{
                        margin: 0,
                        color: TEXTO_SECUNDARIO,
                        fontSize: "11px",
                        fontWeight: "700",
                        lineHeight: 1.4,
                      }}
                    >
                      {item.titulo}
                    </p>
                  </div>

                  <p
                    className="resultados-indicador-valor"
                    style={{
                      color: COLOR_OSCURO,
                      fontSize: "29px",
                      fontWeight: "800",
                      letterSpacing: "-.6px",
                      margin: "0 0 5px",
                    }}
                  >
                    {item.valor}
                  </p>

                  <p style={{ ...textoSecundario, fontSize: "11px" }}>
                    {item.detalle}
                  </p>

                  {item.titulo === "Participación" && (
                    <div
                      style={{
                        height: "5px",
                        background: "#E8EDF1",
                        borderRadius: "8px",
                        overflow: "hidden",
                        marginTop: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: `${participacion}%`,
                          height: "100%",
                          background: COLOR,
                          borderRadius: "8px",
                        }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* RESULTADOS POR LISTA */}
            <section className="resultados-seccion">
              <div style={{ marginBottom: "25px" }}>
                <div style={etiquetaSeccion}>DESGLOSE DE VOTACIÓN</div>
                <h2 style={tituloSeccion}>Resultados por lista</h2>
                <p style={textoSecundario}>
                  Porcentaje de votos por lista, ordenado de mayor a menor
                  resultado.
                </p>
              </div>

              {listasOrdenadas.length === 0 ? (
                <p style={textoSecundario}>
                  No hay listas registradas en este colegio.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "24px",
                  }}
                >
                  {listasOrdenadas.map((lista, indice) => {
                    const porc = Number(porcentaje(lista.cantidadVotos));
                    const logo = obtenerLogoLista(lista);

                    return (
                      <div className="resultados-fila-lista" key={lista.id}>
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px",
                            marginBottom: "10px",
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
                            <div className="resultados-logo-lista">
                              {logo ? (
                                <img
                                  src={logo}
                                  alt={`Logo de ${nombreLista(lista, indice)}`}
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                              ) : (
                                <span
                                  style={{
                                    color: COLOR,
                                    fontSize: "16px",
                                    fontWeight: "800",
                                  }}
                                >
                                  {lista.numero ?? indice + 1}
                                </span>
                              )}
                            </div>

                            <div style={{ minWidth: 0 }}>
                              <p
                                style={{
                                  color: TEXTO,
                                  fontWeight: "700",
                                  fontSize: "14px",
                                  margin: 0,
                                  overflowWrap: "anywhere",
                                }}
                              >
                                {nombreLista(lista, indice)}
                              </p>

                              {lista.candidato && (
                                <p
                                  style={{
                                    color: TEXTO_SECUNDARIO,
                                    fontSize: "12px",
                                    margin: "4px 0 0",
                                  }}
                                >
                                  Candidato: {lista.candidato}
                                </p>
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: "right", flexShrink: 0 }}>
                            <strong
                              style={{
                                color: COLOR_OSCURO,
                                fontSize: "21px",
                                whiteSpace: "nowrap",
                              }}
                            >
                              {porc.toFixed(1)}%
                            </strong>
                            <div
                              style={{
                                color: TEXTO_SECUNDARIO,
                                fontSize: "11px",
                                marginTop: "3px",
                              }}
                            >
                              {lista.cantidadVotos} votos
                            </div>
                          </div>
                        </div>

                        <div
                          style={{
                            height: "10px",
                            width: "100%",
                            background: "#E9EEF2",
                            borderRadius: "8px",
                            overflow: "hidden",
                          }}
                        >
                          <div
                            role="img"
                            aria-label={`${nombreLista(lista, indice)}: ${porc}%`}
                            style={{
                              width: `${porc}%`,
                              minWidth:
                                lista.cantidadVotos > 0 ? "3px" : "0",
                              height: "100%",
                              background: COLOR,
                              borderRadius: "8px",
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div
                style={{
                  borderTop: `1px solid ${BORDE}`,
                  marginTop: "24px",
                  paddingTop: "13px",
                  color: TEXTO_SECUNDARIO,
                  fontSize: "11px",
                }}
              >
                Los porcentajes se calculan sobre el total de votos registrados.
              </div>
            </section>

            {/* RESUMEN ELECTORAL */}
            <section className="resultados-seccion">
              <div style={{ marginBottom: "17px" }}>
                <div style={etiquetaSeccion}>CUADRO ESTADÍSTICO</div>
                <h2 style={tituloSeccion}>Resumen electoral</h2>
                <p style={textoSecundario}>
                  Comparación de votos obtenidos por cada lista.
                </p>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table
                  className="resultados-tabla"
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    fontSize: "13px",
                  }}
                >
                  <thead>
                    <tr>
                      <th>Lista</th>
                      <th>Votos</th>
                      <th>Porcentaje</th>
                    </tr>
                  </thead>

                  <tbody>
                    {listasOrdenadas.map((lista, indice) => (
                      <tr key={lista.id}>
                        <td
                          style={{
                            color: TEXTO,
                            fontWeight: "700",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "9px",
                            }}
                          >
                            <span
                              style={{
                                width: "4px",
                                height: "25px",
                                borderRadius: "3px",
                                background: COLOR,
                                flexShrink: 0,
                              }}
                            />
                            {nombreLista(lista, indice)}
                          </div>
                        </td>

                        <td
                          style={{
                            color: TEXTO,
                            fontWeight: "700",
                          }}
                        >
                          {lista.cantidadVotos}
                        </td>

                        <td
                          style={{
                            color: COLOR_OSCURO,
                            fontWeight: "800",
                          }}
                        >
                          {porcentaje(lista.cantidadVotos)}%
                        </td>
                      </tr>
                    ))}

                    <tr style={{ background: FONDO }}>
                      <td style={{ fontWeight: "800", color: TEXTO }}>
                        TOTAL
                      </td>
                      <td style={{ fontWeight: "800", color: TEXTO }}>
                        {totalVotos}
                      </td>
                      <td style={{ fontWeight: "800", color: COLOR_OSCURO }}>
                        {totalVotos > 0 ? "100.0%" : "0.0%"}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* RESULTADO FINAL */}
            <section
              className="resultados-seccion"
              style={{ borderTop: `3px solid ${COLOR}` }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    background: COLOR_CLARO,
                    color: COLOR,
                    borderRadius: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "22px",
                    flexShrink: 0,
                  }}
                >
                  ★
                </div>

                <div>
                  <h2 style={{ ...tituloSeccion, margin: 0 }}>
                    Resultado final
                  </h2>
                  <p style={{ ...textoSecundario, marginTop: "5px" }}>
                    Resultado según los votos registrados.
                  </p>
                </div>
              </div>

              {ganadores.length === 0 ? (
                <div
                  style={{
                    padding: "16px",
                    background: FONDO,
                    color: TEXTO_SECUNDARIO,
                    border: `1px solid ${BORDE}`,
                    borderRadius: "9px",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Todavía no hay votos registrados. Aún no se puede declarar
                  un ganador.
                </div>
              ) : ganadores.length > 1 ? (
                <>
                  <div
                    style={{
                      display: "inline-block",
                      background: COLOR_CLARO,
                      color: COLOR_OSCURO,
                      padding: "7px 11px",
                      borderRadius: "6px",
                      fontWeight: "800",
                      fontSize: "11px",
                      marginBottom: "13px",
                    }}
                  >
                    EMPATE ELECTORAL
                  </div>

                  <p
                    style={{
                      color: TEXTO_SECUNDARIO,
                      fontSize: "13px",
                      margin: "0 0 15px",
                    }}
                  >
                    Las siguientes listas obtuvieron la misma cantidad de votos:
                  </p>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(200px, 1fr))",
                      gap: "12px",
                    }}
                  >
                    {ganadores.map((lista) => {
                      const indice = listasOrdenadas.indexOf(lista);
                      const logo = obtenerLogoLista(lista);

                      return (
                        <div
                          key={lista.id}
                          style={{
                            background: "#FFFFFF",
                            border: `1px solid ${BORDE}`,
                            borderLeft: `4px solid ${COLOR}`,
                            borderRadius: "9px",
                            padding: "17px",
                            breakInside: "avoid",
                          }}
                        >
                          {logo && (
                            <img
                              src={logo}
                              alt="Logo de campaña"
                              style={{
                                width: "48px",
                                height: "48px",
                                objectFit: "contain",
                                display: "block",
                                marginBottom: "10px",
                              }}
                              onError={(e) => {
                                e.currentTarget.style.display = "none";
                              }}
                            />
                          )}

                          <p
                            style={{
                              color: TEXTO,
                              fontSize: "14px",
                              fontWeight: "700",
                              margin: "0 0 9px",
                            }}
                          >
                            {nombreLista(lista, indice)}
                          </p>

                          <p
                            style={{
                              color: COLOR_OSCURO,
                              fontSize: "22px",
                              fontWeight: "800",
                              margin: 0,
                            }}
                          >
                            {lista.cantidadVotos} votos
                          </p>

                          <p
                            style={{
                              color: TEXTO_SECUNDARIO,
                              fontSize: "12px",
                              margin: "5px 0 0",
                            }}
                          >
                            {porcentaje(lista.cantidadVotos)}% de los votos
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div
                  style={{
                    background: "#FFFFFF",
                    border: `1px solid ${BORDE}`,
                    borderLeft: `4px solid ${COLOR}`,
                    borderRadius: "10px",
                    padding: "21px",
                    breakInside: "avoid",
                  }}
                >
                  <div
                    style={{
                      color: COLOR,
                      fontSize: "10px",
                      fontWeight: "800",
                      letterSpacing: "1.1px",
                      marginBottom: "12px",
                    }}
                  >
                    LISTA CON MAYOR CANTIDAD DE VOTOS
                  </div>

                  {obtenerLogoLista(ganadores[0]) && (
                    <img
                      src={obtenerLogoLista(ganadores[0])}
                      alt="Logo de la lista ganadora"
                      style={{
                        width: "62px",
                        height: "62px",
                        objectFit: "contain",
                        display: "block",
                        marginBottom: "12px",
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = "none";
                      }}
                    />
                  )}

                  <h3
                    style={{
                      color: TEXTO,
                      fontSize: "22px",
                      lineHeight: 1.3,
                      margin: "0 0 10px",
                    }}
                  >
                    {nombreLista(
                      ganadores[0],
                      listasOrdenadas.indexOf(ganadores[0])
                    )}
                  </h3>

                  {ganadores[0].candidato && (
                    <p
                      style={{
                        color: TEXTO_SECUNDARIO,
                        fontSize: "13px",
                        margin: "0 0 12px",
                      }}
                    >
                      Candidato: {ganadores[0].candidato}
                    </p>
                  )}

                  <p
                    style={{
                      color: COLOR_OSCURO,
                      fontSize: "20px",
                      fontWeight: "800",
                      margin: 0,
                    }}
                  >
                    {ganadores[0].cantidadVotos} votos ·{" "}
                    {porcentaje(ganadores[0].cantidadVotos)}%
                  </p>
                </div>
              )}
            </section>
          </>
        )}

        {/* BOTONES */}
        <div
          className="resultados-no-imprimir"
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            marginBottom: "15px",
          }}
        >
          <button
            type="button"
            onClick={imprimirPDF}
            disabled={cargando || Boolean(error)}
            style={{
              background: COLOR,
              color: "#FFFFFF",
              border: `1px solid ${COLOR}`,
              borderRadius: "8px",
              padding: "13px 19px",
              fontSize: "12px",
              fontWeight: "800",
              cursor: cargando || error ? "not-allowed" : "pointer",
              opacity: cargando || error ? 0.55 : 1,
            }}
          >
            ↓ DESCARGAR INFORME PDF
          </button>

          <button
            type="button"
            className="admin-btn-back"
            onClick={volver}
          >
            ← VOLVER AL MENÚ
          </button>
        </div>

        <footer className="resultados-pie">
          <div
            style={{
              width: "38px",
              height: "2px",
              background: COLOR,
              margin: "0 auto 11px",
            }}
          />
          <strong style={{ color: COLOR_OSCURO }}>
            MUNICIPIO ESCOLAR
          </strong>
          <br />
          Informe de resultados electorales · {colegio?.nombre || "Colegio"}
          <br />
          Documento generado el {fechaTexto} a las {horaTexto}
        </footer>
      </div>
    </div>
  );
}

export default Resultados;
