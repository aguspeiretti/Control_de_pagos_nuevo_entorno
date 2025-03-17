import { useEffect, useState } from "react";
import {
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Filter,
  Check,
  AlertTriangle,
  Search,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import Swal from "sweetalert2";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Asegura dos dígitos
  const day = String(today.getDate()).padStart(2, "0"); // Asegura dos dígitos
  return `${year}-${month}-${day}`; // Formato correcto
};

const Home = () => {
  const [filtroFecha, setFiltroFecha] = useState(getTodayDate());
  const [filtroReferencia, setFiltroReferencia] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const pagosPorPagina = 10;
  const [editando, setEditando] = useState(null);
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState({}); // Para almacenar los valores originales antes de editar
  const [isLoading, setIsLoading] = useState(true);
  const [ordenColumna, setOrdenColumna] = useState("Fecha_de_carga");
  const [ordenDireccion, setOrdenDireccion] = useState("desc");
  const [filtradosPorUsuario, setFiltradosPorUsuario] = useState([]);
  const [recordid, setRecordId] = useState("");
  const [fields, setFields] = useState([]);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!filtroFecha) return; // No ejecutar si no hay fecha seleccionada
      setIsLoading(true);
      try {
        // Obtener registros GestionCP filtrados por fecha
        const gestionCPData = await window.ZOHO.CRM.API.searchRecord({
          Entity: "GestionCP",
          Type: "criteria",
          Query: `Fecha_de_carga:equals:${filtroFecha}`,
          delay: false,
        });

        const registrosGestionCP = gestionCPData.data || [];
        console.log(registrosGestionCP);

        // Array para almacenar los resultados finales
        const resultadosCompletos = [];

        // Obtener los registros de Gestiones para cada GestionCP
        for (const registro of registrosGestionCP) {
          // Verificar si existe parent_id
          if (registro.Parent_Id.id) {
            try {
              const recordResponse = await window.ZOHO.CRM.API.getRecord({
                Entity: "Gestiones",
                RecordID: registro.Parent_Id.id,
              });

              // Combinar datos: el registro GestionCP original y los datos de Gestiones
              if (
                recordResponse &&
                recordResponse.data &&
                recordResponse.data.length > 0
              ) {
                resultadosCompletos.push({
                  ...registro,
                  datosGestion: recordResponse.data[0],
                });
              } else {
                // Si no hay datos de Gestiones, incluir solo el registro original
                resultadosCompletos.push(registro);
              }
            } catch (error) {
              console.error(
                `Error al obtener Gestión con ID ${registro.Parent_Id.id}:`,
                error
              );
              resultadosCompletos.push(registro); // Añadir el registro original a pesar del error
            }
          } else {
            // Si no hay parent_id, incluir solo el registro original
            resultadosCompletos.push(registro);
          }
        }
        // console.log(resultadosCompletos);

        // Actualizar el estado con todos los datos combinados
        setData(resultadosCompletos);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filtroFecha]); // Se ejecuta cuando cambia filtroFecha

  useEffect(() => {
    getFields();
  }, []);

  useEffect(() => {
    const fetchData2 = async () => {
      // Solo ejecutar si hay un filtro de referencia
      if (!filtroReferencia) {
        setFiltradosPorUsuario([]);
        return;
      }

      setIsLoading(true);
      try {
        console.log("ejecutado1");
        const searchResponse = await window.ZOHO.CRM.API.searchRecord({
          Entity: "Gestiones",
          Type: "criteria",
          Query: `(Name:equals:${filtroReferencia})AND(Estado:equals:Pago)`,
        });

        if (searchResponse.data && searchResponse.data.length > 0) {
          const recordID = searchResponse.data[0].id;
          setRecordId(recordID);

          const recordResponse = await window.ZOHO.CRM.API.getRecord({
            Entity: "Gestiones",
            RecordID: recordID,
          });

          if (recordResponse.data && recordResponse.data.length > 0) {
            const register = recordResponse.data[0];
            console.log("respuesta", register);

            setFiltradosPorUsuario(register.GestionCP);
          }
        } else {
          setFiltradosPorUsuario([]);
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setFiltradosPorUsuario([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData2();
  }, [filtroReferencia]);

  const handleFiltroFecha = (e) => {
    setFiltroFecha(e.target.value);
    setPaginaActual(1);
  };

  const handleFiltroReferencia = async (e) => {
    const valor = e.target.value;
    setFiltroReferencia(valor);
    setPaginaActual(1);

    // Si no hay valor, usa los datos normales
    if (!valor) {
      setFiltradosPorUsuario([]);
      return;
    }

    // Si hay valor, busca los datos del usuario
    setIsLoading(true);
    try {
      const searchResponse = await window.ZOHO.CRM.API.searchRecord({
        Entity: "Gestiones",
        Type: "criteria",
        Query: `(Name:equals:${valor})`,
      });

      if (searchResponse.data && searchResponse.data.length > 0) {
        const recordID = searchResponse.data[0].id;

        const recordResponse = await window.ZOHO.CRM.API.getRecord({
          Entity: "Gestiones",
          RecordID: recordID,
        });

        if (recordResponse.data && recordResponse.data.length > 0) {
          const register = recordResponse.data[0];
          console.log("Usuario encontrado:", register.Name);
          setFiltradosPorUsuario(register.GestionCP || []);
        } else {
          setFiltradosPorUsuario([]);
        }
      } else {
        setFiltradosPorUsuario([]);
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      setFiltradosPorUsuario([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrdenar = (columna) => {
    const campoMap = {
      REFERENCIA: "Parent_Id.name",
      NPAGO: "N_Pago",
      TIPO: "Tipo",
      MONTO: "Monto",
      "MONTO-SECUNDARIO": "Monto_Secundario",
      "FECHA DE CARGA": "Fecha_de_carga",
      "FECHA CONTABLE": "Fecha_cobro",
      COMPROBANTE: "URL_Comprobante",
      COMENTARIO: "Comentario_Gestor",
      ESTADO: "estado",
    };

    const campo = campoMap[columna] || columna;

    if (ordenColumna === campo) {
      // Si ya está ordenado por esta columna, cambiar dirección
      setOrdenDireccion(ordenDireccion === "asc" ? "desc" : "asc");
    } else {
      // Si es una nueva columna, ordenar ascendente por defecto
      setOrdenColumna(campo);
      setOrdenDireccion("asc");
    }

    // Resetear paginación al ordenar
    setPaginaActual(1);
  };

  const ordenarDatos = (datos) => {
    if (!datos.length) return [];

    return [...datos].sort((a, b) => {
      // Manejar campos anidados como "Parent_Id.name"
      let valorA = ordenColumna.includes(".")
        ? ordenColumna.split(".").reduce((obj, key) => obj && obj[key], a)
        : a[ordenColumna];

      let valorB = ordenColumna.includes(".")
        ? ordenColumna.split(".").reduce((obj, key) => obj && obj[key], b)
        : b[ordenColumna];

      // Convertir a números para campos numéricos
      if (
        ordenColumna === "Monto" ||
        ordenColumna === "Monto_Secundario" ||
        ordenColumna === "N_Pago"
      ) {
        valorA = parseFloat(valorA) || 0;
        valorB = parseFloat(valorB) || 0;
      }
      // Convertir a fechas para campos de fecha
      else if (
        ordenColumna === "Fecha_de_carga" ||
        ordenColumna === "Fecha_cobro"
      ) {
        valorA = valorA ? new Date(valorA).getTime() : 0;
        valorB = valorB ? new Date(valorB).getTime() : 0;
      }
      // Para campos de texto, convertir a minúsculas para ordenamiento insensible a mayúsculas
      else if (typeof valorA === "string" && typeof valorB === "string") {
        valorA = valorA.toLowerCase();
        valorB = valorB.toLowerCase();
      }

      // Manejar valores nulos o indefinidos
      if (valorA === null || valorA === undefined)
        return ordenDireccion === "asc" ? -1 : 1;
      if (valorB === null || valorB === undefined)
        return ordenDireccion === "asc" ? 1 : -1;

      // Devolver orden ascendente o descendente
      if (ordenDireccion === "asc") {
        return valorA > valorB ? 1 : valorA < valorB ? -1 : 0;
      } else {
        return valorA < valorB ? 1 : valorA > valorB ? -1 : 0;
      }
    });
  };

  // Función para filtrar por departamento
  const filtrarPorDepartamento = (pagos) => {
    if (!filtroDepartamento) return pagos; // Si no hay filtro, devolver todos los pagos

    return pagos.filter((pago) => {
      // Verificar si existe datosGestion y Departamento_Gestion
      return (
        pago.datosGestion &&
        pago.datosGestion.Departamento_Gestion &&
        pago.datosGestion.Departamento_Gestion === filtroDepartamento
      );
    });
  };

  // Primero filtrar los datos
  const pagosFiltradosPorBasicos =
    filtroReferencia && filtradosPorUsuario.length > 0
      ? filtradosPorUsuario.filter((pago) => {
          // Solo filtrar por fecha si hay un filtro de fecha
          return filtroFecha
            ? pago.Fecha_de_carga?.includes(filtroFecha)
            : true;
        })
      : data.filter((pago) => {
          const cumpleFiltroFecha = filtroFecha
            ? pago.Fecha_de_carga?.includes(filtroFecha)
            : true;
          const cumpleFiltroReferencia = filtroReferencia
            ? pago.Parent_Id?.name
                ?.toLowerCase()
                .includes(filtroReferencia.toLowerCase())
            : true;

          return cumpleFiltroFecha && cumpleFiltroReferencia;
        });

  // Aplicar filtro de departamento
  const pagosFiltrados = filtrarPorDepartamento(pagosFiltradosPorBasicos);

  // Luego ordenar los datos filtrados
  const pagosOrdenados = ordenarDatos(pagosFiltrados);

  // Finalmente aplicar paginación
  const indexUltimo = paginaActual * pagosPorPagina;
  const indexPrimero = indexUltimo - pagosPorPagina;
  const pagosPaginados = pagosOrdenados.slice(indexPrimero, indexUltimo);
  const totalPaginas = Math.ceil(pagosOrdenados.length / pagosPorPagina);

  // Función para obtener el ícono de ordenamiento
  const getOrdenIcon = (columna) => {
    const campoMap = {
      REFERENCIA: "Parent_Id.name",
      NPAGO: "N_Pago",
      TIPO: "Tipo",
      MONTO: "Monto",
      "MONTO-SECUNDARIO": "Monto_Secundario",
      "FECHA DE CARGA": "Fecha_de_carga",
      "FECHA CONTABLE": "Fecha_cobro",
      COMPROBANTE: "URL_Comprobante",
      COMENTARIO: "Comentario_Gestor",
      ESTADO: "estado",
    };

    const campo = campoMap[columna] || columna;

    if (ordenColumna === campo) {
      return ordenDireccion === "asc" ? (
        <ChevronUp className="w-4 h-4 inline-block ml-1" />
      ) : (
        <ChevronDown className="w-4 h-4 inline-block ml-1" />
      );
    }
    return null;
  };

  const handleEditar = (id, campo, valor) => {
    // Convertir a número si el campo es numérico
    const value = ["Monto", "Monto_Secundario", "N_Pago"].includes(campo)
      ? parseFloat(valor) || 0
      : valor;

    setData((prevData) =>
      prevData.map((pago) =>
        pago.id === id ? { ...pago, [campo]: value } : pago
      )
    );
  };

  const iniciarEdicion = (id) => {
    const pagoActual = data.find((pago) => pago.id === id);

    if (!pagoActual) return;

    setOriginalData({
      id: pagoActual.id,
      Monto: pagoActual.Monto,
      Monto_Secundario: pagoActual.Monto_Secundario,
      Fecha_de_carga: pagoActual.Fecha_de_carga,
      Fecha_cobro: pagoActual.Fecha_cobro,
      Estado_conciliacion: paginaActual.Estado_conciliacion,
    });

    setEditando(id);
  };

  const getFields = () => {
    return new Promise(function (resolve, reject) {
      window.ZOHO.CRM.META.getFields({ Entity: "Gestiones" })
        .then(function (response) {
          setFields(response.fields);
        })
        .catch(function (error) {
          reject(error);
        });
    });
  };

  const getFieldValues = (fields, apiName) => {
    const field = fields.find((item) => item.api_name === apiName);
    return field ? field.pick_list_values || [] : [];
  };

  const departamentoGestion = getFieldValues(fields, "Departamento_Gestion");

  const updateRecord = async (newid, updatedData, recordId) => {
    try {
      // Step 1: Get the current GestionCP array
      const { data: recordData } = await window.ZOHO.CRM.API.getRecord({
        Entity: "Gestiones",
        RecordID: newid,
      });

      if (!recordData || !recordData[0] || !recordData[0].GestionCP) {
        throw new Error("No se pudo obtener los datos actuales");
      }

      // Step 2: Find and update the specific record in the array
      const currentGestionCP = recordData[0].GestionCP;
      const updatedGestionCP = currentGestionCP.map((item) => {
        if (item.id === recordId) {
          // Update only the fields that were modified
          return { ...item, ...updatedData };
        }
        return item;
      });

      // Step 3: Send the complete updated array back
      var config = {
        Entity: "Gestiones",
        APIData: {
          id: newid,
          GestionCP: updatedGestionCP,
        },
      };

      console.log("config", config);
      const response = await window.ZOHO.CRM.API.updateRecord(config);
      console.log("respuesta", response);

      return response;
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });
      throw error;
    }
  };

  const guardarCambios = async (id) => {
    try {
      const pagoActual = data.find((pago) => pago.id === id);
      if (!pagoActual) return;

      // Convertir valores numéricos y añadir estado de modificado
      const updatedFields = {
        Monto: parseFloat(pagoActual.Monto) || 0,
        Monto_Secundario: parseFloat(pagoActual.Monto_Secundario) || 0,
        Fecha_de_carga: pagoActual.Fecha_de_carga,
        Fecha_cobro: pagoActual.Fecha_cobro,
        Estado_conciliacion: "Modificado",
      };

      const newid = pagoActual.Parent_Id.id;
      console.log("new", newid);

      // Ejecutar actualización
      const response = await updateRecord(newid, updatedFields, id);

      // En lugar de volver a cargar todos los datos, simplemente actualizamos el estado local
      setData((prevData) =>
        prevData.map((pago) =>
          pago.id === id
            ? {
                ...pago,
                ...updatedFields,
                Estado_conciliacion: "Modificado",
              }
            : pago
        )
      );

      setEditando(null);

      Swal.fire({
        title: "Éxito!",
        text: "Registro actualizado correctamente",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el registro",
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });
    }
  };

  const cancelarEdicion = () => {
    // Restaurar valores originales
    if (originalData.id) {
      setData((prevData) =>
        prevData.map((pago) =>
          pago.id === originalData.id
            ? {
                ...pago,
                Monto: originalData.Monto,
                Monto_Secundario: originalData.Monto_Secundario,
                Fecha_de_carga: originalData.Fecha_de_carga,
                Fecha_cobro: originalData.Fecha_cobro,
              }
            : pago
        )
      );
    }

    // Salir del modo edición y limpiar datos originales
    setEditando(null);
    setOriginalData({});
  };

  const marcarComoCorrectoDatos = async (id) => {
    try {
      // Find the current record in the data
      const pagoActual = data.find((pago) => pago.id === id);
      if (!pagoActual) return;

      // Get the parent record ID
      const newid = pagoActual.Parent_Id.id;

      // Prepare the updated fields - only changing Estado_conciliacion
      const updatedFields = {
        Estado_conciliacion: "Correcto",
      };

      // Call the updateRecord function to update the record in Zoho CRM
      await updateRecord(newid, updatedFields, id);

      // Update local state directly instead of refetching
      setData((prevData) =>
        prevData.map((pago) =>
          pago.id === id ? { ...pago, Estado_conciliacion: "Correcto" } : pago
        )
      );

      // Show success message
      Swal.fire({
        title: "Éxito!",
        text: "Registro marcado como correcto",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });
    } catch (error) {
      console.error("Error al marcar como correcto:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo marcar el registro como correcto",
        icon: "error",
        timer: 2000,
        showConfirmButton: false,
        position: "top-end",
      });
    }
  };

  // Columnas a mostrar
  const columnas = [
    "FECHA DE CARGA",
    "FECHA CONTABLE",
    "NPAGO",
    "TIPO",
    "REFERENCIA",
    "MONTO-SECUNDARIO",
    "MONTO",
    "COMPROBANTE",
    "COMENTARIO",
    "ESTADO",
    "ACCIONES",
  ];

  const handleFiltroDepartamento = (e) => {
    setFiltroDepartamento(e.target.value);
    setPaginaActual(1); // Resetear a la primera página al filtrar
  };

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen">
      <div className="p-6 max-w-full overflow-hidden">
        {/* <h1 className="text-2xl font-bold mb-6 text-blue-400">
          Gestión de Pagos
        </h1> */}

        <div className="mb-6 bg-gray-800 p-4 rounded-lg">
          <div className="flex flex-wrap gap-4">
            {/* Filtro de Fecha */}
            <div className="flex-1 min-w-64">
              <div className="flex items-center mb-2">
                <Calendar className="mr-2 text-blue-400" />
                <label htmlFor="filtroFecha" className="text-gray-300">
                  Filtrar por fecha:
                </label>
              </div>
              <div className="relative">
                <input
                  id="filtroFecha"
                  type="date"
                  value={filtroFecha}
                  onChange={handleFiltroFecha}
                  className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* Filtro de Referencia */}
            <div className="flex-1 min-w-64">
              <div className="flex items-center mb-2">
                <Search className="mr-2 text-blue-400" />
                <label htmlFor="filtroReferencia" className="text-gray-300">
                  Buscar por referencia:
                </label>
              </div>
              <div className="relative">
                <input
                  id="filtroReferencia"
                  type="text"
                  value={filtroReferencia}
                  onChange={handleFiltroReferencia}
                  placeholder="Ingrese referencia..."
                  className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            {/* Filtro por departamento */}
            <div className="flex-1 min-w-64">
              <div className="flex items-center mb-2">
                <Filter className="mr-2 text-blue-400" />
                <label htmlFor="filtroDepartamento" className="text-gray-300">
                  Filtrar por departamento:
                </label>
              </div>
              <div className="relative">
                <select
                  id="filtroDepartamento"
                  value={filtroDepartamento}
                  onChange={handleFiltroDepartamento}
                  className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Todos los departamentos</option>
                  {departamentoGestion &&
                    departamentoGestion.map((departamento, index) => (
                      <option key={index} value={departamento.display_value}>
                        {departamento.display_value}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            {/* Botón de Filtro */}
            {/* <div className="flex items-end">
              <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center h-10">
                <Filter className="mr-2 w-4 h-4" />
                Aplicar Filtros
              </button>
            </div> */}
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full bg-gray-800 border-collapse">
                <thead>
                  <tr className="bg-gray-700 text-left">
                    {columnas.map((col) => (
                      <th
                        key={col}
                        className={`p-3 font-semibold text-gray-300 border-b border-gray-600 ${
                          col !== "ACCIONES"
                            ? "cursor-pointer hover:bg-gray-650"
                            : ""
                        }`}
                        onClick={() => col !== "ACCIONES" && handleOrdenar(col)}
                      >
                        <div className="flex items-center">
                          <span>{col}</span>
                          {col !== "ACCIONES" && getOrdenIcon(col)}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pagosPaginados.length > 0 ? (
                    pagosPaginados.map((pago, index) => (
                      <tr
                        key={pago.id}
                        className={`border-b border-gray-700 ${
                          index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
                        } hover:bg-gray-700 transition-colors`}
                      >
                        {/* Fecha de carga */}
                        <td className="p-3">
                          {editando === pago.id ? (
                            <input
                              type="date"
                              value={pago.Fecha_de_carga || ""}
                              onChange={(e) =>
                                handleEditar(
                                  pago.id,
                                  "Fecha_de_carga",
                                  e.target.value
                                )
                              }
                              className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
                            />
                          ) : (
                            pago.Fecha_de_carga || "-"
                          )}
                        </td>
                        {/* Fecha de cobro */}
                        <td className="p-3">
                          {editando === pago.id ? (
                            <input
                              type="date"
                              value={pago.Fecha_cobro || ""}
                              onChange={(e) =>
                                handleEditar(
                                  pago.id,
                                  "Fecha_cobro",
                                  e.target.value
                                )
                              }
                              className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
                            />
                          ) : (
                            pago.Fecha_cobro || "-"
                          )}
                        </td>
                        <td className="p-3">{pago.N_Pago || "-"}</td>

                        <td className="p-3">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              pago.Tipo === "Efectivo"
                                ? "bg-green-900 text-green-300"
                                : "bg-blue-900 text-blue-300"
                            }`}
                          >
                            {pago.Tipo || "-"}
                          </span>
                        </td>
                        <td className="p-3">{pago.Parent_Id?.name || "-"}</td>
                        {/* Monto Secundario */}
                        <td className="p-3">
                          {editando === pago.id ? (
                            <input
                              type="number"
                              value={pago.Monto_Secundario || ""}
                              onChange={(e) =>
                                handleEditar(
                                  pago.id,
                                  "Monto_Secundario",
                                  e.target.value
                                )
                              }
                              className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
                            />
                          ) : (
                            <span className="text-gray-300">
                              ${pago.Monto_Secundario || "-"}
                            </span>
                          )}
                        </td>

                        {/* Monto */}
                        <td className="p-3">
                          {editando === pago.id ? (
                            <input
                              type="number"
                              value={pago.Monto || ""}
                              onChange={(e) =>
                                handleEditar(pago.id, "Monto", e.target.value)
                              }
                              className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
                            />
                          ) : (
                            <span className="font-medium text-green-400">
                              ${pago.Monto || "-"}
                            </span>
                          )}
                        </td>

                        {/* URL Comprobante */}
                        <td className="p-3">
                          {pago.URL_Comprobante ? (
                            <a
                              href={pago.URL_Comprobante}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </a>
                          ) : (
                            <span className="text-gray-500">-</span>
                          )}
                        </td>

                        {/* Comentario */}
                        <td className="p-3 max-w-xs truncate">
                          {pago.Comentario_Gestor || "-"}
                        </td>
                        {/* Estado */}
                        <td className="p-3">
                          {pago.Estado_conciliacion === "Correcto" ? (
                            <span className="inline-flex items-center text-green-400">
                              <Check className="w-4 h-4 mr-1" />
                              Correcto
                            </span>
                          ) : pago.Estado_conciliacion === "Modificado" ? (
                            <span className="inline-flex items-center text-amber-400">
                              <AlertTriangle className="w-4 h-4 mr-1" />
                              Modificado
                            </span>
                          ) : (
                            <span className="text-gray-500">Pendiente</span>
                          )}
                        </td>
                        {/* Acciones - Ahora con lógica actualizada */}
                        <td className="p-3">
                          {editando === pago.id ? (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => guardarCambios(pago.id)}
                                className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={cancelarEdicion}
                                className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded"
                              >
                                Cancelar
                              </button>
                            </div>
                          ) : (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => iniciarEdicion(pago.id)}
                                className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
                                title="Editar registro"
                              >
                                <Pencil className="w-5 h-5 text-blue-400" />
                              </button>
                              {/* Solo mostrar el botón "Marcar como correcto" si el estado no es "modificado" */}
                              {pago.estado !== "modificado" && (
                                <button
                                  onClick={() =>
                                    marcarComoCorrectoDatos(pago.id)
                                  }
                                  className="p-1 rounded-full bg-gray-700 hover:bg-green-800 transition-colors"
                                  title="Marcar como correcto"
                                >
                                  <Check className="w-5 h-5 text-green-400" />
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="11"
                        className="p-4 text-center text-gray-400"
                      >
                        No se encontraron registros
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex justify-between items-center">
              <div className="text-sm text-gray-400">
                Mostrando {indexPrimero + 1} -{" "}
                {Math.min(indexUltimo, pagosOrdenados.length)} de{" "}
                {pagosOrdenados.length} registros
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() =>
                    setPaginaActual((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={paginaActual === 1}
                  className="p-2 rounded-md bg-gray-800 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md">
                  <span className="font-medium">{paginaActual}</span>
                  <span className="text-gray-400"> / {totalPaginas}</span>
                </div>

                <button
                  onClick={() =>
                    setPaginaActual((prev) =>
                      prev < totalPaginas ? prev + 1 : prev
                    )
                  }
                  disabled={paginaActual === totalPaginas || totalPaginas === 0}
                  className="p-2 rounded-md bg-gray-800 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Home;

// import { useEffect, useState } from "react";
// import {
//   Pencil,
//   Eye,
//   ChevronLeft,
//   ChevronRight,
//   Calendar,
//   Filter,
//   Check,
//   AlertTriangle,
//   Search,
// } from "lucide-react";

// const Home = () => {
//   const [filtroFecha, setFiltroFecha] = useState("");
//   const [filtroReferencia, setFiltroReferencia] = useState("");
//   const [paginaActual, setPaginaActual] = useState(1);
//   const pagosPorPagina = 10;
//   const [editando, setEditando] = useState(null);
//   const [data, setData] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       setIsLoading(true);
//       try {
//         await window.ZOHO.CRM.API.searchRecord({
//           Entity: "GestionCP",
//           Type: "criteria",
//           Query: "Fecha_de_carga:equals:2025-03-13",
//           delay: false,
//         }).then(function (data) {
//           setData(data.data || []);
//         });
//       } catch (error) {
//         console.error("Error al cargar datos:", error);
//       } finally {
//         setIsLoading(false);
//       }
//     };
//     fetchData();
//   }, []);

//   const handleFiltroFecha = (e) => {
//     setFiltroFecha(e.target.value);
//     setPaginaActual(1);
//   };

//   const handleFiltroReferencia = (e) => {
//     setFiltroReferencia(e.target.value);
//     setPaginaActual(1);
//   };

//   const pagosFiltrados = data.filter((pago) => {
//     const cumpleFiltroFecha = filtroFecha
//       ? pago.Fecha_de_carga?.includes(filtroFecha)
//       : true;
//     const cumpleFiltroReferencia = filtroReferencia
//       ? pago.Parent_Id?.name
//           ?.toLowerCase()
//           .includes(filtroReferencia.toLowerCase())
//       : true;

//     return cumpleFiltroFecha && cumpleFiltroReferencia;
//   });

//   const indexUltimo = paginaActual * pagosPorPagina;
//   const indexPrimero = indexUltimo - pagosPorPagina;
//   const pagosPaginados = pagosFiltrados.slice(indexPrimero, indexUltimo);
//   const totalPaginas = Math.ceil(pagosFiltrados.length / pagosPorPagina);

//   const handleEditar = (id, campo, valor) => {
//     setData((prevData) =>
//       prevData.map((pago) =>
//         pago.id === id ? { ...pago, [campo]: valor } : pago
//       )
//     );
//   };

//   const guardarCambios = (id) => {
//     // Al guardar cambios, automáticamente marcamos como modificado
//     setData((prevData) =>
//       prevData.map((pago) =>
//         pago.id === id ? { ...pago, estado: "modificado" } : pago
//       )
//     );

//     // Aquí iría la lógica para guardar los cambios en el servidor

//     // Salimos del modo edición
//     setEditando(null);
//   };

//   const marcarComoCorrectoDatos = (id) => {
//     // Marcar como correcto
//     setData((prevData) =>
//       prevData.map((pago) =>
//         pago.id === id ? { ...pago, estado: "correcto" } : pago
//       )
//     );

//     // Aquí iría la lógica para actualizar en el servidor
//   };

//   return (
//     <div className="bg-gray-900 text-gray-100 min-h-screen">
//       <div className="p-6 max-w-full overflow-hidden">
//         <h1 className="text-2xl font-bold mb-6 text-blue-400">
//           Gestión de Pagos
//         </h1>

//         <div className="mb-6 bg-gray-800 p-4 rounded-lg">
//           <div className="flex flex-wrap gap-4">
//             {/* Filtro de Fecha */}
//             <div className="flex-1 min-w-64">
//               <div className="flex items-center mb-2">
//                 <Calendar className="mr-2 text-blue-400" />
//                 <label htmlFor="filtroFecha" className="text-gray-300">
//                   Filtrar por fecha:
//                 </label>
//               </div>
//               <div className="relative">
//                 <input
//                   id="filtroFecha"
//                   type="date"
//                   value={filtroFecha}
//                   onChange={handleFiltroFecha}
//                   className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>

//             {/* Filtro de Referencia */}
//             <div className="flex-1 min-w-64">
//               <div className="flex items-center mb-2">
//                 <Search className="mr-2 text-blue-400" />
//                 <label htmlFor="filtroReferencia" className="text-gray-300">
//                   Buscar por referencia:
//                 </label>
//               </div>
//               <div className="relative">
//                 <input
//                   id="filtroReferencia"
//                   type="text"
//                   value={filtroReferencia}
//                   onChange={handleFiltroReferencia}
//                   placeholder="Ingrese referencia..."
//                   className="bg-gray-700 border border-gray-600 rounded-md p-2 w-full text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                 />
//               </div>
//             </div>

//             {/* Botón de Filtro */}
//             <div className="flex items-end">
//               <button className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center h-10">
//                 <Filter className="mr-2 w-4 h-4" />
//                 Aplicar Filtros
//               </button>
//             </div>
//           </div>
//         </div>

//         {isLoading ? (
//           <div className="flex justify-center items-center h-64">
//             <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
//           </div>
//         ) : (
//           <>
//             <div className="overflow-x-auto rounded-lg shadow">
//               <table className="min-w-full bg-gray-800 border-collapse">
//                 <thead>
//                   <tr className="bg-gray-700 text-left">
//                     {[
//                       "REFERENCIA",
//                       "NPAGO",
//                       "TIPO",
//                       "MONTO",
//                       "MONTO-SECUNDARIO",
//                       "FECHA DE CARGA",
//                       "FECHA CONTABLE",
//                       "COMPROBANTE",
//                       "COMENTARIO",
//                       "ESTADO",
//                       "ACCIONES",
//                     ].map((col) => (
//                       <th
//                         key={col}
//                         className="p-3 font-semibold text-gray-300 border-b border-gray-600"
//                       >
//                         {col}
//                       </th>
//                     ))}
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {pagosPaginados.length > 0 ? (
//                     pagosPaginados.map((pago, index) => (
//                       <tr
//                         key={pago.id}
//                         className={`border-b border-gray-700 ${
//                           index % 2 === 0 ? "bg-gray-800" : "bg-gray-750"
//                         } hover:bg-gray-700 transition-colors`}
//                       >
//                         <td className="p-3">{pago.Parent_Id?.name || "-"}</td>
//                         <td className="p-3">{pago.N_Pago || "-"}</td>
//                         <td className="p-3">
//                           <span
//                             className={`px-2 py-1 rounded-full text-xs font-medium ${
//                               pago.Tipo === "Efectivo"
//                                 ? "bg-green-900 text-green-300"
//                                 : "bg-blue-900 text-blue-300"
//                             }`}
//                           >
//                             {pago.Tipo || "-"}
//                           </span>
//                         </td>
//                         {/* Monto */}
//                         <td className="p-3">
//                           {editando === pago.id ? (
//                             <input
//                               type="number"
//                               value={pago.Monto || ""}
//                               onChange={(e) =>
//                                 handleEditar(pago.id, "Monto", e.target.value)
//                               }
//                               className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
//                             />
//                           ) : (
//                             <span className="font-medium text-green-400">
//                               ${pago.Monto || "-"}
//                             </span>
//                           )}
//                         </td>
//                         {/* Monto Secundario */}
//                         <td className="p-3">
//                           {editando === pago.id ? (
//                             <input
//                               type="number"
//                               value={pago.Monto_Secundario || ""}
//                               onChange={(e) =>
//                                 handleEditar(
//                                   pago.id,
//                                   "Monto_Secundario",
//                                   e.target.value
//                                 )
//                               }
//                               className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
//                             />
//                           ) : (
//                             <span className="text-gray-300">
//                               ${pago.Monto_Secundario || "-"}
//                             </span>
//                           )}
//                         </td>
//                         {/* Fecha de carga */}
//                         <td className="p-3">
//                           {editando === pago.id ? (
//                             <input
//                               type="date"
//                               value={pago.Fecha_de_carga || ""}
//                               onChange={(e) =>
//                                 handleEditar(
//                                   pago.id,
//                                   "Fecha_de_carga",
//                                   e.target.value
//                                 )
//                               }
//                               className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
//                             />
//                           ) : (
//                             pago.Fecha_de_carga || "-"
//                           )}
//                         </td>
//                         {/* Fecha de cobro */}
//                         <td className="p-3">
//                           {editando === pago.id ? (
//                             <input
//                               type="date"
//                               value={pago.Fecha_cobro || ""}
//                               onChange={(e) =>
//                                 handleEditar(
//                                   pago.id,
//                                   "Fecha_cobro",
//                                   e.target.value
//                                 )
//                               }
//                               className="bg-gray-700 border border-gray-600 rounded p-1 w-full text-gray-100"
//                             />
//                           ) : (
//                             pago.Fecha_cobro || "-"
//                           )}
//                         </td>
//                         {/* URL Comprobante */}
//                         <td className="p-3">
//                           {pago.URL_Comprobante ? (
//                             <a
//                               href={pago.URL_Comprobante}
//                               target="_blank"
//                               rel="noopener noreferrer"
//                               className="inline-flex items-center text-blue-400 hover:text-blue-300 transition-colors"
//                             >
//                               <Eye className="w-4 h-4 mr-1" />
//                               Ver
//                             </a>
//                           ) : (
//                             <span className="text-gray-500">-</span>
//                           )}
//                         </td>
//                         {/* Comentario */}
//                         <td className="p-3 max-w-xs truncate">
//                           {pago.Comentario_Gestor || "-"}
//                         </td>
//                         {/* Estado */}
//                         <td className="p-3">
//                           {pago.estado === "correcto" ? (
//                             <span className="inline-flex items-center text-green-400">
//                               <Check className="w-4 h-4 mr-1" />
//                               Correcto
//                             </span>
//                           ) : pago.estado === "modificado" ? (
//                             <span className="inline-flex items-center text-amber-400">
//                               <AlertTriangle className="w-4 h-4 mr-1" />
//                               Modificado
//                             </span>
//                           ) : (
//                             <span className="text-gray-500">Pendiente</span>
//                           )}
//                         </td>
//                         {/* Acciones - Simplificado a solo editar y marcar como correcto */}
//                         <td className="p-3">
//                           {editando === pago.id ? (
//                             <div className="flex space-x-2">
//                               <button
//                                 onClick={() => guardarCambios(pago.id)}
//                                 className="bg-green-600 hover:bg-green-700 text-white p-1 rounded"
//                               >
//                                 Guardar
//                               </button>
//                               <button
//                                 onClick={() => setEditando(null)}
//                                 className="bg-gray-600 hover:bg-gray-700 text-white p-1 rounded"
//                               >
//                                 Cancelar
//                               </button>
//                             </div>
//                           ) : (
//                             <div className="flex space-x-2">
//                               <button
//                                 onClick={() => setEditando(pago.id)}
//                                 className="p-1 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
//                                 title="Editar registro"
//                               >
//                                 <Pencil className="w-5 h-5 text-blue-400" />
//                               </button>
//                               <button
//                                 onClick={() => marcarComoCorrectoDatos(pago.id)}
//                                 className="p-1 rounded-full bg-gray-700 hover:bg-green-800 transition-colors"
//                                 title="Marcar como correcto"
//                               >
//                                 <Check className="w-5 h-5 text-green-400" />
//                               </button>
//                             </div>
//                           )}
//                         </td>
//                       </tr>
//                     ))
//                   ) : (
//                     <tr>
//                       <td
//                         colSpan="11"
//                         className="p-4 text-center text-gray-400"
//                       >
//                         No se encontraron registros
//                       </td>
//                     </tr>
//                   )}
//                 </tbody>
//               </table>
//             </div>

//             <div className="mt-6 flex justify-between items-center">
//               <div className="text-sm text-gray-400">
//                 Mostrando {indexPrimero + 1} -{" "}
//                 {Math.min(indexUltimo, pagosFiltrados.length)} de{" "}
//                 {pagosFiltrados.length} registros
//               </div>

//               <div className="flex items-center space-x-2">
//                 <button
//                   onClick={() =>
//                     setPaginaActual((prev) => Math.max(prev - 1, 1))
//                   }
//                   disabled={paginaActual === 1}
//                   className="p-2 rounded-md bg-gray-800 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                 >
//                   <ChevronLeft className="w-5 h-5" />
//                 </button>

//                 <div className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-md">
//                   <span className="font-medium">{paginaActual}</span>
//                   <span className="text-gray-400"> / {totalPaginas}</span>
//                 </div>

//                 <button
//                   onClick={() =>
//                     setPaginaActual((prev) =>
//                       prev < totalPaginas ? prev + 1 : prev
//                     )
//                   }
//                   disabled={paginaActual === totalPaginas || totalPaginas === 0}
//                   className="p-2 rounded-md bg-gray-800 border border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
//                 >
//                   <ChevronRight className="w-5 h-5" />
//                 </button>
//               </div>
//             </div>
//           </>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Home;
