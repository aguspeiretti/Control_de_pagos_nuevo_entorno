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
  Sun,
  Moon,
  X,
  CircleSlash2,
  BanknoteX,
} from "lucide-react";

import Swal from "sweetalert2";

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
// Función para formatear fechas
const formatDate = (dateString) => {
  if (!dateString) return "-";
  try {
    // Si la fecha viene en formato YYYY-MM-DD, la convertimos correctamente
    const [year, month, day] = dateString.split("-");
    if (year && month && day) {
      return `${day}/${month}/${year}`;
    }
    // Si no viene en ese formato, intentamos crear un objeto Date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "-";
    const formattedDay = String(date.getDate()).padStart(2, "0");
    const formattedMonth = String(date.getMonth() + 1).padStart(2, "0");
    const formattedYear = date.getFullYear();
    return `${formattedDay}/${formattedMonth}/${formattedYear}`;
  } catch (error) {
    console.error("Error al formatear fecha:", error);
    return "-";
  }
};

const puedeEditar = (pago) => {
  return pago.Comentario_Gestor !== "MIGRACION";
};

const Home = () => {
  const [filtroFecha, setFiltroFecha] = useState(getTodayDate());
  const [filtroReferencia, setFiltroReferencia] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const pagosPorPagina = 10;
  const [editando, setEditando] = useState(null);
  const [data, setData] = useState([]);
  const [originalData, setOriginalData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [ordenColumna, setOrdenColumna] = useState("Fecha_de_carga");
  const [ordenDireccion, setOrdenDireccion] = useState("desc");
  const [filtradosPorUsuario, setFiltradosPorUsuario] = useState([]);
  const [recordid, setRecordId] = useState("");
  const [fields, setFields] = useState([]);
  const [fields2, setFields2] = useState([]);
  const [filtroDepartamento, setFiltroDepartamento] = useState("");
  const [puedeConciliar, setPuedeConciliar] = useState(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);
  const [gestiones, setGestiones] = useState([]);
  const [busado, setBusado] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroFechaContable, setFiltroFechaContable] = useState("");
  const [filtroFechaModificacionGestor, setFiltroFechaModificacionGestor] =
    useState("");
  const [filtroMedioPago, setFiltroMedioPago] = useState("");
  const [searchMedioPago, setSearchMedioPago] = useState("");
  const [showMedioPagoDropdown, setShowMedioPagoDropdown] = useState(false);
  const [showTableMedioPagoDropdown, setShowTableMedioPagoDropdown] =
    useState(false);
  const [searchTableMedioPago, setSearchTableMedioPago] = useState("");
  const [motivosRechazo, setMotivosRechazo] = useState([]);
  const [showMotivoPopup, setShowMotivoPopup] = useState(false);
  const [selectedMotivo, setSelectedMotivo] = useState("");
  const [currentActionId, setCurrentActionId] = useState(null);
  const [actionType, setActionType] = useState("");
  const [gestionDetalle, setGestionDetalle] = useState(null);
  const [selectedPaymentId, setSelectedPaymentId] = useState(null);
  const [editandoPopup, setEditandoPopup] = useState(null);
  const [originalDataPopup, setOriginalDataPopup] = useState({});
  const [motivosModificacion, setMotivosModificacion] = useState([]);

  useEffect(() => {
    // Verificar preferencia guardada
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setDarkMode(savedTheme === "dark");
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    } else {
      // Verificar preferencia del sistema
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      setDarkMode(prefersDark);
      document.documentElement.classList.toggle("dark", prefersDark);
    }
  }, []);

  const handleFiltroEstado = (e) => {
    setFiltroEstado(e.target.value);
    setPaginaActual(1);
  };

  const toggleDarkMode = () => {
    setDarkMode((prev) => {
      const newValue = !prev;
      document.documentElement.classList.toggle("dark", newValue);
      localStorage.setItem("theme", newValue ? "dark" : "light");
      return newValue;
    });
  };

  const departmentCategories = {
    "Argentina (Abazcu y xPandete)": [
      "Abazcu",
      "xPandete",
      "Proyectos",
      "Soporte",
    ],
    "Consultoría Integral TIC": ["Mexico"],
    "Consultoría Integral COL": ["Colombia"],
    "Academicast Spa": ["Chile"],
    "Quicktypers LLC": ["Panamá", "EEUU"],
    "Ushuaia Contenidos": [
      "Estudiantes",
      "Clientes",
      "Alumnos",
      "Formación",
      "Trabajos",
      "Gestión TFG",
      "QuieroMiTFG",
      "UD",
    ],
  };

  useEffect(() => {
    const fetchData3 = async () => {
      try {
        const searchResponse = await window.ZOHO.CRM.API.searchRecord({
          Entity: "Gestiones",
          Type: "criteria",
          Query: `(Name:equals:${busado})`,
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
            console.log("respuesta 3", register.GestionCP);
            setGestiones(register.GestionCP);
            // Filtrar los GestionCP por la fecha seleccionada
            /* const filteredGestionCP = register.GestionCP.filter((pago) =>
              pago.Fecha_de_carga?.includes(filtroFecha)
            );*/

            /* setFiltradosPorUsuario(filteredGestionCP);*/
          }
        } else {
        }
      } catch (error) {
        console.error("Error al cargar datos:", error);
        setFiltradosPorUsuario([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData3();
  }, []);

  function getUsers(id) {
    return new Promise((resolve, reject) => {
      window.ZOHO.CRM.API.getUser({ ID: id })
        .then((data) => {
          resolve(data);
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  useEffect(() => {
    window.ZOHO.CRM.CONFIG.getCurrentUser()
      .then((data) => {
        const userid = data.users[0].id;
        return getUsers(userid);
      })
      .then((userData) => {
        const puedeConciliarValue = userData.users[0].Puede_conciliar;
        setPuedeConciliar(
          Array.isArray(puedeConciliarValue) ? puedeConciliarValue : []
        );
      })
      .catch((error) => {
        console.error("Error al obtener usuario:", error);
        setPuedeConciliar([]);
      })
      .finally(() => {
        setIsLoadingUser(false);
      });
  }, []);

  useEffect(() => {
    window.ZOHO.CRM.CONFIG.getCurrentUser()
      .then((data) => {
        const userid = data.users[0].id;
        return getUsers(userid);
      })
      .then((userData) => {
        const puedeConciliarValue = userData.users[0].Puede_conciliar;

        const permisos = Array.isArray(puedeConciliarValue)
          ? puedeConciliarValue
          : [];

        setPuedeConciliar(permisos);
      })
      .catch((error) => {
        console.error("Error al obtener usuario:", error);
        setPuedeConciliar([]);
      })
      .finally(() => {
        setIsLoadingUser(false);
      });
  }, []);

  const fetchAllGestionCP = async () => {
    let allData = [];
    let page = 1;
    const perPage = 200;
    let hasMore = true;

    // Build the query based on active filters

    let dateQuery;
    if (filtroFechaModificacionGestor) {
      dateQuery = `Fecha_modificacion_del_gestor:equals:${filtroFechaModificacionGestor}`;
    } else if (filtroFecha) {
      dateQuery = `Fecha_de_carga:equals:${filtroFecha}`;
    } else if (filtroFechaContable) {
      dateQuery = `Fecha_cobro:equals:${filtroFechaContable}`;
    } else {
      dateQuery = `Fecha_de_carga:equals:${getTodayDate()}`;
    }

    while (hasMore) {
      try {
        const response = await window.ZOHO.CRM.API.searchRecord({
          Entity: "GestionCP",
          Type: "criteria",
          Query: dateQuery,
          page: page,
          per_page: perPage,
        });

        if (response.data?.length > 0) {
          allData = allData.concat(response.data);
          page++;
          hasMore = response.data.length === perPage;
        } else {
          hasMore = false;
        }
      } catch (error) {
        console.error("Error en paginación:", error);
        hasMore = false;
      }
    }
    return allData;
  };

  const fetchBulkGestiones = async (parentIds) => {
    const chunkSize = 100;
    const gestionesMap = new Map();

    for (let i = 0; i < parentIds.length; i += chunkSize) {
      const chunk = parentIds.slice(i, i + chunkSize);
      try {
        const response = await window.ZOHO.CRM.API.searchRecord({
          Entity: "Gestiones",
          Type: "criteria",
          Query: `(id:in:${chunk.join(",")})`,
          per_page: chunkSize,
        });

        (response.data || []).forEach((g) => gestionesMap.set(g.id, g));
      } catch (error) {
        console.error("Error en búsqueda masiva:", error);
      }
    }
    return gestionesMap;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (
        !filtroFecha &&
        !filtroFechaContable &&
        !filtroFechaModificacionGestor
      )
        return;
      setIsLoading(true);

      try {
        const allGestionCP = await fetchAllGestionCP();
        console.log("allgestion", allGestionCP);

        const parentIds = allGestionCP
          .map((record) => record.Parent_Id?.id)
          .filter((id) => id);

        const gestionesMap = await fetchBulkGestiones(parentIds);

        const resultadosCompletos = allGestionCP.map((record) => ({
          ...record,
          datosGestion: gestionesMap.get(record.Parent_Id?.id) || null,
        }));

        setData(resultadosCompletos);
      } catch (error) {
        console.error("Error al cargar datos:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [filtroFecha, filtroFechaContable, filtroFechaModificacionGestor]);

  useEffect(() => {
    getFields();
    getFields2();
  }, []);

  useEffect(() => {
    const fetchData2 = async () => {
      if (!filtroReferencia) {
        setFiltradosPorUsuario([]);
        return;
      }

      setIsLoading(true);
      try {
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

            // Filter based on active date filter
            const filteredGestionCP = register.GestionCP.filter((pago) => {
              if (filtroFechaModificacionGestor) {
                return pago.Fecha_modificacion_del_gestor?.includes(
                  filtroFechaModificacionGestor
                );
              }
              if (filtroFecha) {
                return pago.Fecha_de_carga?.includes(filtroFecha);
              } else if (filtroFechaContable) {
                return pago.Fecha_cobro?.includes(filtroFechaContable);
              }
              return true;
            });

            setFiltradosPorUsuario(filteredGestionCP);
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
  }, [filtroReferencia, filtroFecha, filtroFechaContable]);

  const handleFiltroFechaContable = (e) => {
    setFiltroFechaContable(e.target.value);
    setFiltroFecha(""); // Clear fecha de carga filter
    setFiltroFechaModificacionGestor("");
    setPaginaActual(1);
  };

  const handleFiltroFechaModificacionGestor = (e) => {
    setFiltroFechaModificacionGestor(e.target.value);
    setFiltroFecha("");
    setFiltroFechaContable("");
    setPaginaActual(1);
  };

  const handleFiltroFecha = (e) => {
    setFiltroFecha(e.target.value);
    setFiltroFechaContable(""); // Clear fecha contable filter
    setFiltroFechaModificacionGestor("");
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
      "FECHA MODIFICACION GESTOR": "Fecha_modificacion_del_gestor",
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
    if (!puedeConciliar || !Array.isArray(puedeConciliar)) {
      return [];
    }

    // Filtrar primero por los departamentos que el usuario puede ver
    const pagosPermitidos = pagos.filter((pago) => {
      const departamento = pago.datosGestion?.Departamento_Gestion;
      const tienePermiso = puedeConciliar.includes(departamento);

      if (!tienePermiso) {
      }

      return tienePermiso;
    });

    // Si no hay filtro de departamento específico, devolver todos los permitidos
    if (!filtroDepartamento) {
      return pagosPermitidos;
    }

    // Si hay filtro específico, filtrar por la categoría seleccionada
    const depsEnCategoria = departmentCategories[filtroDepartamento] || [];

    const pagosFiltradosPorCategoria = pagosPermitidos.filter((pago) => {
      const departamento = pago.datosGestion?.Departamento_Gestion;
      return depsEnCategoria.includes(departamento);
    });

    return pagosFiltradosPorCategoria;
  };

  const pagosFiltradosPorBasicos =
    filtroReferencia && filtradosPorUsuario.length > 0
      ? filtradosPorUsuario.filter((pago) => {
          const cumpleFiltroFecha = filtroFecha
            ? pago.Fecha_de_carga?.includes(filtroFecha)
            : true;
          const cumpleFiltroEstado = filtroEstado
            ? filtroEstado === "Pendiente"
              ? pago.Estado_conciliacion === null ||
                pago.Estado_conciliacion === undefined ||
                pago.Estado_conciliacion === "Pendiente"
              : pago.Estado_conciliacion === filtroEstado
            : true;
          const cumpleFiltroMedioPago = filtroMedioPago
            ? pago.Cuentas_bancarias === filtroMedioPago
            : true;
          return (
            cumpleFiltroFecha && cumpleFiltroEstado && cumpleFiltroMedioPago
          );
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
          const cumpleFiltroEstado = filtroEstado
            ? filtroEstado === "Pendiente"
              ? pago.Estado_conciliacion === null ||
                pago.Estado_conciliacion === undefined ||
                pago.Estado_conciliacion === "Pendiente"
              : pago.Estado_conciliacion === filtroEstado
            : true;
          const cumpleFiltroMedioPago = filtroMedioPago
            ? pago.Cuentas_bancarias === filtroMedioPago
            : true;

          return (
            cumpleFiltroFecha &&
            cumpleFiltroReferencia &&
            cumpleFiltroEstado &&
            cumpleFiltroMedioPago
          );
        });

  const pagosFiltrados = filtrarPorDepartamento(pagosFiltradosPorBasicos);

  const pagosOrdenados = ordenarDatos(pagosFiltrados);

  // Cálculos de paginación optimizados
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

  const handleFiltroMedioPago = (value) => {
    setFiltroMedioPago(value);
    setShowMedioPagoDropdown(false);
    setPaginaActual(1);
  };
  const handleEditarPopup = (id, campo, valor) => {
    if (
      [
        "Monto",
        "Monto_Secundario",
        "Monto_total_comprobante",
        "N_Pago",
      ].includes(campo)
    ) {
      valor = validateNumericInput(valor);
    }

    setPopupData((prevData) =>
      prevData.map((pago) =>
        pago.id === id ? { ...pago, [campo]: valor } : pago
      )
    );
  };

  const iniciarEdicionPopup = (id) => {
    const pagoActual = popupData.find((pago) => pago.id === id);
    if (!pagoActual) return;

    setOriginalDataPopup({
      id: pagoActual.id,
      Fecha_de_carga: pagoActual.Fecha_de_carga,
      Fecha_cobro: pagoActual.Fecha_cobro,
      Estado_conciliacion: pagoActual.Estado_conciliacion,
      Cuentas_bancarias: pagoActual.Cuentas_bancarias,
    });

    setEditandoPopup(id);
  };

  const hayCambiosPopup = (pago) => {
    return (
      pago.Fecha_cobro !== originalDataPopup.Fecha_cobro ||
      pago.Cuentas_bancarias !== originalDataPopup.Cuentas_bancarias
    );
  };

  const guardarCambiosPopup = async (id) => {
    const pagoActual = popupData.find((pago) => pago.id === id);

    if (!hayCambiosPopup(pagoActual)) {
      Swal.fire({
        title: "Sin cambios",
        text: "No se han realizado cambios para guardar",
        icon: "info",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
      return;
    }

    setCurrentActionId(id);
    setActionType("modify");
    setShowMotivoPopup(true);
  };

  const cancelarEdicionPopup = () => {
    if (originalDataPopup.id) {
      setPopupData((prevData) =>
        prevData.map((pago) =>
          pago.id === originalDataPopup.id
            ? {
                ...pago,
                Fecha_de_carga: originalDataPopup.Fecha_de_carga,
                Fecha_cobro: originalDataPopup.Fecha_cobro,
                Cuentas_bancarias: originalDataPopup.Cuentas_bancarias,
              }
            : pago
        )
      );
    }

    setEditandoPopup(null);
    setOriginalDataPopup({});
  };

  const marcarComoCorrectoPopup = async (id) => {
    const pagoActual = popupData.find((pago) => pago.id === id);
    if (!pagoActual) return;

    const updatedFields = {
      Estado_conciliacion: "Correcto",
      Estado: "Pago",
    };

    await updateRecord(recordid, updatedFields, id);

    setPopupData((prev) =>
      prev.map((pago) =>
        pago.id === id ? { ...pago, ...updatedFields } : pago
      )
    );

    // También actualizar la data principal si existe
    setData((prev) =>
      prev.map((pago) =>
        pago.id === id ? { ...pago, ...updatedFields } : pago
      )
    );

    Swal.fire({
      title: "¡Éxito!",
      text: "Registro marcado como correcto",
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
    });
  };

  const rechazarRegistroPopup = async (id) => {
    setCurrentActionId(id);
    setActionType("reject");
    setShowMotivoPopup(true);
  };

  // Modificar las funciones de edición para incluir la validación
  const handleEditar = (id, campo, valor) => {
    // Si es un campo numérico, aplicar validación adicional
    if (
      [
        "Monto",
        "Monto_Secundario",
        "Monto_total_comprobante",
        "N_Pago",
      ].includes(campo)
    ) {
      valor = validateNumericInput(valor);
      const numericValue = parseFloat(valor) || 0;

      setData((prevData) =>
        prevData.map((pago) =>
          pago.id === id ? { ...pago, [campo]: valor } : pago
        )
      );
    } else {
      // Para campos no numéricos, mantener el comportamiento original
      setData((prevData) =>
        prevData.map((pago) =>
          pago.id === id ? { ...pago, [campo]: valor } : pago
        )
      );
    }
  };

  const iniciarEdicion = (id) => {
    const pagoActual = data.find((pago) => pago.id === id);

    if (!pagoActual) return;

    setOriginalData({
      id: pagoActual.id,
      // Solo guardar campos editables
      Fecha_de_carga: pagoActual.Fecha_de_carga,
      Fecha_cobro: pagoActual.Fecha_cobro,
      Estado_conciliacion: pagoActual.Estado_conciliacion,
      Cuentas_bancarias: pagoActual.Cuentas_bancarias,
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
  const getFields2 = () => {
    return new Promise(function (resolve, reject) {
      window.ZOHO.CRM.META.getFields({ Entity: "GestionCP" })
        .then(function (response) {
          setFields2(response.fields);

          // Obtener motivos de rechazo
          const motivosRechazoField = response.fields.find(
            (field) => field.api_name === "Motivo_Rechazo_Modificado"
          );
          if (motivosRechazoField && motivosRechazoField.pick_list_values) {
            // Filtrar opciones que no sean "-None-"
            const motivosValidos = motivosRechazoField.pick_list_values.filter(
              (motivo) => motivo.actual_value !== "-None-"
            );
            setMotivosRechazo(motivosValidos);
          }

          // Obtener motivos de modificación
          const motivosModificacionField = response.fields.find(
            (field) => field.api_name === "Motivo_modificacion"
          );
          if (
            motivosModificacionField &&
            motivosModificacionField.pick_list_values
          ) {
            // Filtrar opciones que no sean "-None-"
            const motivosValidos =
              motivosModificacionField.pick_list_values.filter(
                (motivo) => motivo.actual_value !== "-None-"
              );
            setMotivosModificacion(motivosValidos);
          }
        })
        .catch(function (error) {
          reject(error);
        });
    });
  };

  const getFieldValues = (fields, apiName) => {
    const field = fields.find((item) => item.api_name === apiName);
    if (!field) return [];
    const values = field.pick_list_values || [];
    return values.filter((value) => value.actual_value !== "-None-");
  };

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

      const response = await window.ZOHO.CRM.API.updateRecord(config);

      return response;
    } catch (error) {
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#f8fafc",
        color: "#1e293b",
        customClass: {
          popup: "colored-toast",
        },
      });
      throw error;
    }
  };

  const hayCambios = (pago) => {
    return (
      // Solo comparar campos editables (remover montos)
      pago.Fecha_cobro !== originalData.Fecha_cobro ||
      pago.Cuentas_bancarias !== originalData.Cuentas_bancarias
    );
  };

  const guardarCambios = async (id) => {
    const pagoActual = data.find((pago) => pago.id === id);

    if (!hayCambios(pagoActual)) {
      Swal.fire({
        title: "Sin cambios",
        text: "No se han realizado cambios para guardar",
        icon: "info",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#f8fafc",
        color: "#1e293b",
        customClass: {
          popup: "colored-toast",
        },
      });
      return;
    }

    setCurrentActionId(id);
    setActionType("modify");
    setShowMotivoPopup(true);

    try {
      const updatedFields = {
        Monto: parseFloat(pagoActual.Monto) || 0,
        Monto_Secundario: parseFloat(pagoActual.Monto_Secundario) || 0,
        Monto_total_comprobante:
          parseFloat(pagoActual.Monto_total_comprobante) || 0,
        Fecha_cobro: pagoActual.Fecha_cobro,
        Cuentas_bancarias: pagoActual.Cuentas_bancarias,
        Estado_conciliacion: "Modificado",
      };

      const newid = pagoActual.Parent_Id.id;

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
        text: "Guardado correctamente",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: "#f8fafc",
        color: "#1e293b",
        customClass: {
          popup: "colored-toast",
        },
      });
    } catch (error) {
      console.error("Error al guardar:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el registro",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 2000,
        timerProgressBar: true,
        background: "#f8fafc",
        color: "#1e293b",
        customClass: {
          popup: "colored-toast",
        },
      });
    }
    setCurrentActionId(id);
    setActionType("modify");
    setShowMotivoPopup(true);
  };

  const cancelarEdicion = () => {
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
                Cuentas_bancarias: originalData.Cuentas_bancarias,
              }
            : pago
        )
      );
    }

    setEditando(null);
    setOriginalData({});
  };

  // const marcarComoCorrectoDatos = async (id) => {
  //   setCurrentActionId(id);
  //   setActionType("correct");
  //   setShowMotivoPopup(true);
  // };

  const marcarComoCorrectoDatos = async (id) => {
    const pagoActual = data.find((pago) => pago.id === id);
    if (!pagoActual) return;
    const newid = pagoActual.Parent_Id.id;
    const updatedFields = {
      Estado_conciliacion: "Correcto",
      Estado: "Pago",
    };
    // actualiza en CRM
    await updateRecord(newid, updatedFields, id);
    // actualiza estado en la tabla
    setData((prev) =>
      prev.map((pago) =>
        pago.id === id ? { ...pago, ...updatedFields } : pago
      )
    );
    // notifica al usuario
    Swal.fire({
      title: "Éxito!",
      text: "Registro marcado como correcto",
      icon: "success",
      toast: true,
      position: "top-end",
      showConfirmButton: false,
      timer: 2000,
      timerProgressBar: true,
      background: "#f8fafc",
      color: "#1e293b",
    });
  };

  const handleFiltroDepartamento = (e) => {
    setFiltroDepartamento(e.target.value);
    setPaginaActual(1); // Resetear a la primera página al filtrar
  };

  // Agregar esta función de validación para los campos numéricos
  const handleNumericInputKeyDown = (e) => {
    // Lista de teclas permitidas: números, backspace, delete, tab, flechas, punto decimal, etc.
    const allowedKeys = [
      "Backspace",
      "Delete",
      "Tab",
      "ArrowLeft",
      "ArrowRight",
      "ArrowUp",
      "ArrowDown",
      ".",
      ",",
    ];

    // Si no es una tecla permitida ni un número, evitar la entrada
    if (!allowedKeys.includes(e.key) && !/[0-9]/.test(e.key)) {
      e.preventDefault();
    }

    // Prevenir específicamente la 'e', '+', '-' que podrían usarse en notación científica
    if (["e", "E", "+", "-"].includes(e.key)) {
      e.preventDefault();
    }
  };

  // Función adicional para validar el valor después de cambios
  const validateNumericInput = (value) => {
    // Eliminar todos los caracteres que no sean números o punto decimal
    return value.replace(/[^0-9.]/g, "");
  };

  const handleReferenciaClick = async (nombre, selectedId = null) => {
    setBusado(nombre);
    setSelectedPaymentId(selectedId); // Nuevo: guardar el ID del pago seleccionado
    setPopupLoading(true);
    setShowPopup(true);

    try {
      const searchResponse = await window.ZOHO.CRM.API.searchRecord({
        Entity: "Gestiones",
        Type: "criteria",
        Query: `(Name:equals:${nombre})`,
      });

      if (searchResponse.data && searchResponse.data.length > 0) {
        const recordID = searchResponse.data[0].id;
        setRecordId(recordID);
        const gestion = searchResponse?.data?.[0] || null;
        setGestionDetalle(gestion);
        const recordResponse = await window.ZOHO.CRM.API.getRecord({
          Entity: "Gestiones",
          RecordID: recordID,
        });

        if (recordResponse.data && recordResponse.data.length > 0) {
          const register = recordResponse.data[0];
          setPopupData(register.GestionCP || []);
        }
      }
    } catch (error) {
      console.error("Error al cargar datos:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los datos",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        background: "#f8fafc",
        color: "#1e293b",
        customClass: {
          popup: "colored-toast",
        },
      });
    } finally {
      setPopupLoading(false);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showTableMedioPagoDropdown) {
        const dropdowns = document.querySelectorAll(".relative");
        let clickedInside = false;

        dropdowns.forEach((dropdown) => {
          if (dropdown.contains(event.target)) {
            clickedInside = true;
          }
        });

        if (!clickedInside) {
          setShowTableMedioPagoDropdown(null);
          setSearchTableMedioPago("");
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showTableMedioPagoDropdown]);

  // Columnas a mostrar
  const columnas = [
    "ACCIONES",
    "ESTADO",
    "FECHA CARGA",
    "FECHA CONTABLE",
    "F.MOD GESTOR",
    "N°",
    "TIPO",
    "REFERENCIA",
    "MEDIO PAGO",
    "MONTO-SEC.",
    "MONTO",
    "MONTO TOTAL",
    "COMPR",
    "COMENTARIO",
  ];

  // Columnas para el popup (sin acciones)
  const columnasPopup = [
    "FECHA CARGA",
    "FECHA CONTABLE",
    "NPAGO",
    "TIPO",
    "REFERENCIA",
    "MEDIO DE PAGO",
    "MONTO-SECUNDARIO",
    "MONTO",
    "MONTO TOTAL",
    "COMPROBANTE",
    "COMENTARIO",
    "ESTADO",
  ];

  const departamentoGestion = getFieldValues(fields, "Departamento_Gestion");
  const cuentasBancarias = getFieldValues(fields2, "Cuentas_bancarias");

  const rechazarRegistro = async (id) => {
    setCurrentActionId(id);
    setActionType("reject");
    setShowMotivoPopup(true);
  };
  // const rechazarRegistro = async (id) => {
  //   const pagoActual = data.find((pago) => pago.id === id);
  //   if (!pagoActual) return;
  //   const newid = pagoActual.Parent_Id.id;
  //   const updatedFields = {
  //     Estado_conciliacion: "Rechazado",
  //     Estado: "Rechazado",
  //   };
  //   ejecutar la actualización en CRM
  //   await updateRecord(newid, updatedFields, id);
  //   actualizar estado local
  //   setData((prev) =>
  //     prev.map((pago) =>
  //       pago.id === id ? { ...pago, ...updatedFields } : pago
  //     )
  //   );
  //   Swal.fire({
  //     title: "Éxito!",
  //     text: "Registro rechazado correctamente",
  //     icon: "success",
  //     toast: true,
  //     position: "top-end",
  //     showConfirmButton: false,
  //     timer: 2000,
  //     timerProgressBar: true,
  //     background: "#f8fafc",
  //     color: "#1e293b",
  //   });
  // };
  const handleMotivoConfirm = async (motivo) => {
    try {
      // Buscar el pago en popupData si estamos en el popup
      const pagoActual =
        popupData.find((pago) => pago.id === currentActionId) ||
        data.find((pago) => pago.id === currentActionId);

      if (!pagoActual) return;

      const newid = pagoActual.Parent_Id.id;
      let updatedFields = {};

      switch (actionType) {
        case "reject":
          updatedFields = {
            Motivo_Rechazo_Modificado: motivo, // Campo específico para rechazo
            Estado_conciliacion: "Rechazado",
            Estado: "Rechazado",
          };
          break;
        case "modify":
          updatedFields = {
            Motivo_modificacion: motivo, // Campo específico para modificación
            Estado_conciliacion: "Modificado",
            Fecha_cobro: pagoActual.Fecha_cobro,
            Cuentas_bancarias: pagoActual.Cuentas_bancarias,
          };
          break;
        case "correct":
          updatedFields = {
            Estado_conciliacion: "Correcto",
            Estado: "Correcto",
          };
          break;
      }

      await updateRecord(newid, updatedFields, currentActionId);

      // Actualizar popupData
      setPopupData((prevData) =>
        prevData.map((pago) =>
          pago.id === currentActionId ? { ...pago, ...updatedFields } : pago
        )
      );

      // También actualizar data principal
      setData((prevData) =>
        prevData.map((pago) =>
          pago.id === currentActionId ? { ...pago, ...updatedFields } : pago
        )
      );

      // Reset states
      setShowMotivoPopup(false);
      setSelectedMotivo("");
      setCurrentActionId(null);
      setEditandoPopup(null);

      Swal.fire({
        title: "¡Éxito!",
        text:
          actionType === "reject"
            ? "Registro rechazado correctamente"
            : actionType === "modify"
            ? "Registro modificado correctamente"
            : "Registro marcado como correcto",
        icon: "success",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    } catch (error) {
      console.error("Error:", error);
      Swal.fire({
        title: "Error",
        text: "No se pudo procesar la solicitud",
        icon: "error",
        toast: true,
        position: "top-end",
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
      });
    }
  };

  const MotivoPopup = ({ onClose, onConfirm, type }) => {
    // Obtener los motivos correctos según el tipo
    const motivosAUsar =
      type === "reject" ? motivosRechazo : motivosModificacion;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">
            {type === "reject" ? "Motivo de Rechazo" : "Motivo de Modificación"}
          </h2>
          <select
            value={selectedMotivo}
            onChange={(e) => setSelectedMotivo(e.target.value)}
            className="w-full p-2 mb-4 border rounded dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200"
          >
            <option value="">Seleccione un motivo</option>
            {motivosAUsar.map((motivo, index) => (
              <option key={index} value={motivo.actual_value}>
                {motivo.display_value}
              </option>
            ))}
          </select>
          <div className="flex justify-end space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded hover:bg-gray-300 dark:hover:bg-gray-500"
            >
              Cancelar
            </button>
            <button
              onClick={() => onConfirm(selectedMotivo)}
              disabled={!selectedMotivo}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    );
  };
  const nf = new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  const fmtCurrency = (valor, moneda) => {
    try {
      if (moneda && typeof moneda === "string" && moneda.length <= 3) {
        return new Intl.NumberFormat("es-AR", {
          style: "currency",
          currency: moneda,
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        }).format(Number(valor || 0));
      }
    } catch (_) {}
    return `$ ${nf.format(Number(valor || 0))}`;
  };
  const EstadoBadge = ({ estado }) => {
    if (!estado) return <span className="text-gray-500">-</span>;
    const cls =
      estado === "Correcto"
        ? "bg-green-100 text-green-700"
        : estado === "Modificado"
        ? "bg-amber-100 text-amber-700"
        : estado === "Rechazado"
        ? "bg-red-100 text-red-700"
        : "bg-gray-100 text-gray-700";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${cls}`}>
        {estado}
      </span>
    );
  };

  const MiniChip = ({ label, value }) => (
    <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 px-2 py-2 shadow-sm flex flex-col gap-0.5 min-w-0">
      <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
        {value ?? "-"}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200 min-h-screen">
      <div className="p-6 max-w-full overflow-hidden">
        {isLoadingUser ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-gray-600 dark:text-gray-300">
              Cargando permisos...
            </p>
          </div>
        ) : !puedeConciliar?.length ? (
          <div className="flex flex-col items-center justify-center h-64 bg-white dark:bg-gray-800 rounded-lg shadow">
            <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
            <h2 className="text-xl font-semibold text-red-600 dark:text-red-400 mb-2">
              No tiene permisos.
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center">
              No tiene permisos para acceder a esta funcionalidad.
              <br />
              Por favor, contacte con el administrador del sistema.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
              <div className="flex flex-wrap gap-4">
                {/* Botón de tema */}
                <div className="flex items-center">
                  <button
                    onClick={toggleDarkMode}
                    className="p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title={
                      darkMode
                        ? "Cambiar a modo claro"
                        : "Cambiar a modo oscuro"
                    }
                  >
                    {darkMode ? (
                      <Sun className="w-5 h-5 text-yellow-500" />
                    ) : (
                      <Moon className="w-5 h-5 text-gray-700" />
                    )}
                  </button>
                </div>
                {/* Filtro de Fecha */}
                <div className="flex-1 min-w-64">
                  <div className="flex items-center mb-2">
                    <Calendar className="mr-2 text-blue-500" />
                    <label
                      htmlFor="filtroFecha"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Filtrar por fecha de carga:
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="filtroFecha"
                      type="date"
                      value={filtroFecha}
                      onChange={handleFiltroFecha}
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* New Fecha Contable filter */}
                <div className="flex-1 min-w-64">
                  <div className="flex items-center mb-2">
                    <Calendar className="mr-2 text-blue-500" />
                    <label
                      htmlFor="filtroFechaContable"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Filtrar por fecha contable:
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="filtroFechaContable"
                      type="date"
                      value={filtroFechaContable}
                      onChange={handleFiltroFechaContable}
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-64">
                  <div className="flex items-center mb-2">
                    <Calendar className="mr-2 text-blue-500" />
                    <label
                      htmlFor="filtroFechaContable"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      {" "}
                      Fecha modificación gestor:
                    </label>
                  </div>
                  <div className="relative">
                    <input
                      id="filtroFechaGestor"
                      type="date"
                      value={filtroFechaModificacionGestor}
                      onChange={handleFiltroFechaModificacionGestor}
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="flex-1 min-w-64">
                  {/* Filtro de Estado */}
                  <div className="flex items-center mb-2">
                    <Filter className="mr-2 text-blue-500" />
                    <label
                      htmlFor="filtroEstado"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Filtrar por estado:
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      id="filtroEstado"
                      value={filtroEstado}
                      onChange={handleFiltroEstado}
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Todos los estados</option>
                      <option value="Pendiente">Pendiente</option>
                      <option value="Modificado">Modificado</option>
                      <option value="Correcto">Correcto</option>
                      <option value="Rechazado">Rechazado</option>
                    </select>
                  </div>
                </div>
                <div className="flex-1 min-w-64">
                  <div className="flex items-center mb-2">
                    <Filter className="mr-2 text-blue-500" />
                    <label
                      htmlFor="filtroMedioPago"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Filtrar por medio de pago:
                    </label>
                  </div>
                  <div className="relative">
                    <div
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full text-gray-800 dark:text-gray-200 cursor-pointer flex justify-between items-center"
                      onClick={() =>
                        setShowMedioPagoDropdown(!showMedioPagoDropdown)
                      }
                    >
                      <span>
                        {filtroMedioPago || "Seleccione medio de pago"}
                      </span>
                      <ChevronDown className="w-4 h-4" />
                    </div>
                    {showMedioPagoDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                        <div className="p-2">
                          <input
                            type="text"
                            value={searchMedioPago}
                            onChange={(e) => setSearchMedioPago(e.target.value)}
                            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
                            placeholder="Buscar medio de pago..."
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                          <div
                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                            onClick={() => handleFiltroMedioPago("")}
                          >
                            Todos los medios de pago
                          </div>
                          {cuentasBancarias
                            .filter((cuenta) =>
                              cuenta.display_value
                                .toLowerCase()
                                .includes(searchMedioPago.toLowerCase())
                            )
                            .map((cuenta, index) => (
                              <div
                                key={index}
                                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                onClick={() =>
                                  handleFiltroMedioPago(cuenta.display_value)
                                }
                              >
                                {cuenta.display_value}
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Filtro de Referencia */}
                <div className="flex-1 min-w-64">
                  <div className="flex items-center mb-2">
                    <Search className="mr-2 text-blue-500" />
                    <label
                      htmlFor="filtroReferencia"
                      className="text-gray-700 dark:text-gray-300"
                    >
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
                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md p-2 w-full text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                {/* Filtro por departamento */}

                <div className="flex-1 min-w-64">
                  <div className="flex items-center mb-2">
                    <Filter className="mr-2 text-blue-500" />
                    <label
                      htmlFor="filtroDepartamento"
                      className="text-gray-700 dark:text-gray-300"
                    >
                      Filtrar por departamento:
                    </label>
                  </div>
                  <div className="relative">
                    <select
                      id="filtroDepartamento"
                      value={filtroDepartamento}
                      onChange={handleFiltroDepartamento}
                      className="bg-white dark:bg-gray-700 border rounded-md p-2 w-full"
                    >
                      <option value="">
                        Todos los departamentos permitidos
                      </option>
                      {Object.keys(departmentCategories)
                        .filter((categoria) => {
                          // Solo mostrar categorías que tienen al menos un departamento permitido
                          const depsEnCategoria =
                            departmentCategories[categoria] || [];
                          return depsEnCategoria.some((dep) =>
                            puedeConciliar?.includes(dep)
                          );
                        })
                        .map((categoria) => (
                          <option key={categoria} value={categoria}>
                            {categoria}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto min-h-[500px] rounded-lg shadow">
                  <table className="min-w-full bg-white dark:bg-gray-800 border-collapse">
                    <thead>
                      <tr className="bg-gray-100 dark:bg-gray-700 text-left">
                        {columnas.map((col) => (
                          <th
                            key={col}
                            className={`p-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600 ${
                              col !== "ACCIONES"
                                ? "cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                                : ""
                            }`}
                            onClick={() =>
                              col !== "ACCIONES" && handleOrdenar(col)
                            }
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
                            className={`border-b border-gray-200 dark:border-gray-600 ${
                              index % 2 === 0
                                ? "bg-white dark:bg-gray-800"
                                : "bg-gray-50 dark:bg-gray-700"
                            } hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                          >
                            {/* Acciones */}
                            <td className="p-3">
                              <button
                                onClick={() =>
                                  handleReferenciaClick(
                                    pago.Parent_Id?.name,
                                    pago.id
                                  )
                                }
                                className="p-1 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors"
                                title="Ver detalles"
                              >
                                <Eye className="w-5 h-5 text-blue-600" />
                              </button>
                            </td>
                            {/* Estado */}
                            <td className="p-3">
                              {pago.Estado_conciliacion === "Correcto" ? (
                                <span className="inline-flex items-center text-green-600">
                                  <Check className="w-4 h-4 mr-1" />
                                  Correcto
                                </span>
                              ) : pago.Estado_conciliacion === "Modificado" ? (
                                <span className="inline-flex items-center text-amber-600 dark:text-amber-500">
                                  <AlertTriangle className="w-4 h-4 mr-1" />
                                  Modificado
                                </span>
                              ) : pago.Estado_conciliacion === "Rechazado" ? (
                                <span className="inline-flex items-center text-red-600 dark:text-red-500">
                                  <X className="w-4 h-4 mr-1" />
                                  Rechazado
                                </span>
                              ) : (
                                <span className="text-gray-500">Pendiente</span>
                              )}
                            </td>
                            {/* Fecha de carga */}
                            <td className="p-3">
                              {editando === pago.id ? (
                                <span className="text-gray-800 dark:text-gray-200">
                                  {formatDate(pago.Fecha_de_carga)}
                                </span>
                              ) : (
                                <span className="text-gray-800 dark:text-gray-200">
                                  {formatDate(pago.Fecha_de_carga)}
                                </span>
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
                                  className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1 w-full text-gray-800 dark:text-gray-200"
                                />
                              ) : (
                                <span className="text-gray-800 dark:text-gray-200">
                                  {formatDate(pago.Fecha_cobro)}
                                </span>
                              )}
                            </td>
                            <td>
                              {formatDate(pago.Fecha_modificacion_del_gestor)}
                            </td>
                            <td className="p-3">{pago.N_Pago || "-"}</td>

                            <td className="p-3">
                              <span
                                className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-center whitespace-normal break-words ${
                                  pago.Tipo === "Efectivo"
                                    ? "bg-green-100 text-green-800"
                                    : "bg-blue-100 text-blue-800"
                                }`}
                              >
                                {pago.Tipo || "-"}
                              </span>
                            </td>

                            <td className="p-3">
                              <button
                                onClick={() =>
                                  handleReferenciaClick(pago.Parent_Id?.name)
                                }
                                className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline"
                              >
                                {pago.Parent_Id?.name || "-"}
                              </button>
                            </td>
                            {/* New Medio de Pago column */}
                            <td className="p-3">
                              {editando === pago.id ? (
                                <div className="relative">
                                  <div
                                    className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1 w-full text-gray-800 dark:text-gray-200 cursor-pointer flex justify-between items-center"
                                    onClick={() =>
                                      setShowTableMedioPagoDropdown(pago.id)
                                    }
                                  >
                                    <span>
                                      {pago.Cuentas_bancarias ||
                                        "Seleccionar..."}
                                    </span>
                                    <ChevronDown className="w-4 h-4" />
                                  </div>
                                  {showTableMedioPagoDropdown === pago.id && (
                                    <div className="absolute z-10 w-64 mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg">
                                      <div className="p-2">
                                        <input
                                          type="text"
                                          value={searchTableMedioPago}
                                          onChange={(e) =>
                                            setSearchTableMedioPago(
                                              e.target.value
                                            )
                                          }
                                          className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800"
                                          placeholder="Buscar medio de pago..."
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                      <div className="max-h-48 overflow-y-auto">
                                        {cuentasBancarias
                                          .filter((cuenta) =>
                                            cuenta.display_value
                                              .toLowerCase()
                                              .includes(
                                                searchTableMedioPago.toLowerCase()
                                              )
                                          )
                                          .map((cuenta, index) => (
                                            <div
                                              key={index}
                                              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer"
                                              onClick={() => {
                                                handleEditar(
                                                  pago.id,
                                                  "Cuentas_bancarias",
                                                  cuenta.actual_value
                                                );
                                                setShowTableMedioPagoDropdown(
                                                  null
                                                );
                                                setSearchTableMedioPago("");
                                              }}
                                            >
                                              {cuenta.display_value}
                                            </div>
                                          ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-800 dark:text-gray-200">
                                  {pago.Cuentas_bancarias || "-"}
                                </span>
                              )}
                            </td>
                            {/* Monto Secundario */}
                            <td className="p-3">
                              <span className="text-gray-800 dark:text-gray-200">
                                $
                                {Number(
                                  pago.Monto_Secundario || 0
                                ).toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>

                            {/* Monto */}
                            <td className="p-3">
                              <span className="font-medium text-green-600 dark:text-green-400">
                                $
                                {Number(pago.Monto || 0).toLocaleString(
                                  "es-AR",
                                  {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2,
                                  }
                                )}
                              </span>
                            </td>

                            {/* Monto total */}
                            <td className="p-3">
                              <span className="font-medium text-green-600 dark:text-green-400">
                                $
                                {Number(
                                  pago.Monto_total_comprobante || 0
                                ).toLocaleString("es-AR", {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </span>
                            </td>

                            {/* URL Comprobante */}
                            <td className="p-3">
                              {pago.URL_Comprobante ? (
                                <a
                                  href={pago.URL_Comprobante}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  Ver
                                </a>
                              ) : (
                                <span className="text-gray-500">-</span>
                              )}
                            </td>

                            {/* Comentario */}

                            <td className="p-3 max-w-xs">
                              <div className="relative group">
                                <div className="truncate">
                                  {pago.Comentario_Gestor || "-"}
                                </div>
                                {pago.Comentario_Gestor && (
                                  <div className="absolute z-10 invisible group-hover:visible bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-2 max-w-md whitespace-normal break-words text-sm text-gray-800 dark:text-gray-200">
                                    {pago.Comentario_Gestor}
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan="11"
                            className="p-4 text-center text-gray-500 dark:text-gray-400"
                          >
                            No se encontraron registros
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="mt-6 flex justify-between items-center">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
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
                      className="p-2 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md">
                      <span className="font-medium">{paginaActual}</span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {" "}
                        / {totalPaginas}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setPaginaActual((prev) =>
                          prev < totalPaginas ? prev + 1 : prev
                        )
                      }
                      disabled={
                        paginaActual === totalPaginas || totalPaginas === 0
                      }
                      className="p-2 rounded-md bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center hover:bg-gray-50 dark:hover:bg-gray-600"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </>
            )}

            {showPopup && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white dark:bg-gray-800 w-full h-full flex flex-col">
                  <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-600">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                      Detalles de {busado}
                    </h2>
                    <button
                      onClick={() => setShowPopup(false)}
                      className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      <svg
                        className="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                  {gestionDetalle && (
                    <div className="mb-3">
                      {/* Grid de chips súper compacto */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                        <div className="col-span-2 sm:col-span-1">
                          <div className="rounded-xl border dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 shadow-sm">
                            <span className="text-[10px] uppercase tracking-wide text-gray-500 dark:text-gray-400">
                              Estado de la gestión
                            </span>
                            <div className="pt-0.5">
                              <EstadoBadge
                                estado={gestionDetalle?.Estado_de_la_gestion}
                              />
                            </div>
                          </div>
                        </div>
                        <MiniChip
                          label="Presupuesto principal"
                          value={Number(
                            gestionDetalle?.Presupuesto ?? 0
                          ).toLocaleString("es-AR")}
                        />
                        <MiniChip
                          label="Total pagado"
                          value={fmtCurrency(
                            gestionDetalle?.Total_monto_pagado,
                            gestionDetalle?.Moneda_cobro
                          )}
                        />
                        <MiniChip
                          label="Falta cobrar (cliente)"
                          value={fmtCurrency(
                            gestionDetalle?.Falta_cobrar_cliente,
                            gestionDetalle?.Moneda_cobro
                          )}
                        />
                        <MiniChip
                          label="Precio por página"
                          value={fmtCurrency(
                            gestionDetalle?.Precio_de_pagina,
                            gestionDetalle?.Moneda_cobro
                          )}
                        />
                        <MiniChip
                          label="Moneda"
                          value={gestionDetalle?.Moneda_cobro || "-"}
                        />
                        <MiniChip
                          label="Páginas contratadas"
                          value={Number(
                            gestionDetalle?.Numero_de_Paginas ?? 0
                          ).toLocaleString("es-AR")}
                        />
                        <MiniChip
                          label="Páginas pagadas"
                          value={Number(
                            gestionDetalle?.Total_Paginas_pagadas ?? 0
                          ).toLocaleString("es-AR")}
                        />

                        <MiniChip
                          label="Páginas faltantes"
                          value={Number(
                            gestionDetalle?.Falta_paginas_cliente ?? 0
                          ).toLocaleString("es-AR")}
                        />
                      </div>
                    </div>
                  )}
                  {popupLoading ? (
                    <div className="flex justify-center items-center h-full">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                    </div>
                  ) : (
                    <div className="flex-1 overflow-auto">
                      <table className="min-w-full bg-white dark:bg-gray-800 border-collapse">
                        <thead>
                          <tr className="bg-gray-100 dark:bg-gray-700 text-left sticky top-0">
                            <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                              ACCIONES
                            </th>
                            <th className="p-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
                              ESTADO
                            </th>
                            {columnasPopup.map((col) => (
                              <th
                                key={col}
                                className="p-3 font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600"
                              >
                                {col}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {popupData.length > 0 ? (
                            popupData.map((pago, index) => (
                              <tr
                                key={pago.id}
                                className={`border-b border-gray-200 dark:border-gray-600 ${
                                  selectedPaymentId === pago.id
                                    ? "bg-yellow-100 dark:bg-yellow-900/30 border-l-4 border-l-yellow-500 dark:border-l-yellow-400 shadow-md"
                                    : index % 2 === 0
                                    ? "bg-white dark:bg-gray-800"
                                    : "bg-gray-50 dark:bg-gray-700"
                                } hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors`}
                              >
                                {/* Columna de acciones */}
                                <td className="p-3">
                                  {editandoPopup === pago.id ? (
                                    <div className="flex space-x-2">
                                      <button
                                        onClick={() =>
                                          guardarCambiosPopup(pago.id)
                                        }
                                        className={`p-1 rounded-full transition-colors ${
                                          hayCambiosPopup(pago)
                                            ? "bg-green-100 hover:bg-green-200"
                                            : "bg-gray-100 cursor-not-allowed opacity-50"
                                        }`}
                                        title="Guardar cambios"
                                        disabled={!hayCambiosPopup(pago)}
                                      >
                                        <Check className="w-5 h-5 text-green-600" />
                                      </button>
                                      <button
                                        onClick={cancelarEdicionPopup}
                                        className="p-1 rounded-full bg-orange-100 hover:bg-orange-200 transition-colors"
                                        title="Cancelar edición"
                                      >
                                        <X className="w-5 h-5 text-orange-600" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex space-x-2">
                                      {puedeEditar(pago) && (
                                        <button
                                          onClick={() =>
                                            iniciarEdicionPopup(pago.id)
                                          }
                                          className="text-blue-500 hover:text-blue-700"
                                          title="Editar"
                                        >
                                          <Pencil className="w-5 h-5" />
                                        </button>
                                      )}
                                      <button
                                        onClick={() =>
                                          marcarComoCorrectoPopup(pago.id)
                                        }
                                        className="text-green-500 hover:text-green-700"
                                        title="Marcar como correcto"
                                      >
                                        <Check className="w-5 h-5" />
                                      </button>
                                      <button
                                        onClick={() =>
                                          rechazarRegistroPopup(pago.id)
                                        }
                                        className="text-red-500 hover:text-red-700"
                                        title="Rechazar"
                                      >
                                        <CircleSlash2 className="w-5 h-5" />
                                      </button>
                                    </div>
                                  )}
                                </td>

                                {/* Columna de estado */}
                                <td className="p-3">
                                  {pago.Estado_conciliacion === "Correcto" ? (
                                    <span className="inline-flex items-center text-green-600">
                                      <Check className="w-4 h-4 mr-1" />
                                      Correcto
                                    </span>
                                  ) : pago.Estado_conciliacion ===
                                    "Modificado" ? (
                                    <span className="inline-flex items-center text-amber-600 dark:text-amber-500">
                                      <AlertTriangle className="w-4 h-4 mr-1" />
                                      Modificado
                                    </span>
                                  ) : pago.Estado_conciliacion ===
                                    "Rechazado" ? (
                                    <span className="inline-flex items-center text-red-600 dark:text-red-500">
                                      <X className="w-4 h-4 mr-1" />
                                      Rechazado
                                    </span>
                                  ) : (
                                    <span className="text-gray-500">
                                      Pendiente
                                    </span>
                                  )}
                                </td>

                                {/* Fecha de carga */}
                                <td className="p-3">
                                  <span className="text-gray-800 dark:text-gray-200">
                                    {formatDate(pago.Fecha_de_carga)}
                                  </span>
                                </td>

                                {/* Fecha contable - EDITABLE */}
                                <td className="p-3">
                                  {editandoPopup === pago.id ? (
                                    <input
                                      type="date"
                                      value={pago.Fecha_cobro || ""}
                                      onChange={(e) =>
                                        handleEditarPopup(
                                          pago.id,
                                          "Fecha_cobro",
                                          e.target.value
                                        )
                                      }
                                      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1 w-full text-gray-800 dark:text-gray-200"
                                    />
                                  ) : (
                                    <span className="text-gray-800 dark:text-gray-200">
                                      {formatDate(pago.Fecha_cobro)}
                                    </span>
                                  )}
                                </td>

                                {/* Resto de columnas no editables */}
                                <td className="p-3">{pago.N_Pago || "-"}</td>
                                <td className="p-3">
                                  <span
                                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium text-center whitespace-normal break-words ${
                                      pago.Tipo === "Efectivo"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-blue-100 text-blue-800"
                                    }`}
                                  >
                                    {pago.Tipo || "-"}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {pago.Parent_Id?.name || "-"}
                                </td>

                                {/* Medio de Pago - EDITABLE */}
                                <td className="p-3">
                                  {editandoPopup === pago.id ? (
                                    <div className="relative">
                                      <select
                                        value={pago.Cuentas_bancarias || ""}
                                        onChange={(e) =>
                                          handleEditarPopup(
                                            pago.id,
                                            "Cuentas_bancarias",
                                            e.target.value
                                          )
                                        }
                                        className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded p-1 w-full text-gray-800 dark:text-gray-200"
                                      >
                                        <option value="">Seleccionar...</option>
                                        {cuentasBancarias.map((cuenta, idx) => (
                                          <option
                                            key={idx}
                                            value={cuenta.actual_value}
                                          >
                                            {cuenta.display_value}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                  ) : (
                                    <span className="text-gray-800 dark:text-gray-200">
                                      {pago.Cuentas_bancarias || "-"}
                                    </span>
                                  )}
                                </td>

                                {/* Resto de columnas (montos, comprobantes, etc.) */}
                                <td className="p-3">
                                  <span className="text-gray-800 dark:text-gray-200">
                                    $
                                    {Number(
                                      pago.Monto_Secundario || 0
                                    ).toLocaleString("es-AR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    $
                                    {Number(pago.Monto || 0).toLocaleString(
                                      "es-AR",
                                      {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      }
                                    )}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="font-medium text-green-600 dark:text-green-400">
                                    $
                                    {Number(
                                      pago.Monto_total_comprobante || 0
                                    ).toLocaleString("es-AR", {
                                      minimumFractionDigits: 2,
                                      maximumFractionDigits: 2,
                                    })}
                                  </span>
                                </td>
                                <td className="p-3">
                                  {pago.URL_Comprobante ? (
                                    <a
                                      href={pago.URL_Comprobante}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                                    >
                                      <Eye className="w-4 h-4 mr-1" />
                                      Ver
                                    </a>
                                  ) : (
                                    <span className="text-gray-500">-</span>
                                  )}
                                </td>
                                <td className="p-3 max-w-xs">
                                  <div className="relative group">
                                    <div className="truncate">
                                      {pago.Comentario_Gestor || "-"}
                                    </div>
                                    {pago.Comentario_Gestor && (
                                      <div className="absolute z-10 invisible group-hover:visible bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg p-2 max-w-md whitespace-normal break-words text-sm text-gray-800 dark:text-gray-200">
                                        {pago.Comentario_Gestor}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td
                                colSpan="12"
                                className="p-4 text-center text-gray-500 dark:text-gray-400"
                              >
                                No se encontraron registros
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {showMotivoPopup && (
        <MotivoPopup
          onClose={() => {
            setShowMotivoPopup(false);
            setSelectedMotivo("");
            setCurrentActionId(null);
          }}
          onConfirm={handleMotivoConfirm}
          type={actionType}
        />
      )}
    </div>
  );
};

export default Home;
