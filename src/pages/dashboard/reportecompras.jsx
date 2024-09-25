import React from "react";
import * as XLSX from "xlsx";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";

export function ReporteCompras() {
  const generarReporte = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/compras");
      const compras = response.data;

      const datosReporte = compras.map((compra) => ({
        "Número de Recibo": compra.numero_recibo || "N/A",
        "Proveedor": compra.proveedorCompra?.nombre || "Desconocido",
        "Fecha de Compra": compra.fecha_compra.split("T")[0],
        "Fecha de Registro": compra.fecha_registro.split("T")[0],
        "Estado": compra.estado,
        "Total": parseFloat(compra.total).toFixed(2),
        "Anulación": compra.motivo_anulacion || "N/A",  // Incluyendo el campo de anulación
      }));

      const worksheet = XLSX.utils.json_to_sheet(datosReporte);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Reporte de Compras");

      XLSX.writeFile(workbook, "reporte_compras.xlsx");

      Swal.fire({
        icon: "success",
        title: "Reporte generado correctamente",
        showConfirmButton: false,
        timer: 2000,
      });
    } catch (error) {
      console.error("Error al generar el reporte:", error);
      Swal.fire({
        icon: "error",
        title: "Error al generar el reporte",
        text: "Hubo un problema al generar el reporte de compras.",
      });
    }
  };

  React.useEffect(() => {
    generarReporte();
  }, []);

  return null;
}
