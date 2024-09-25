import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Button,
  Checkbox,
  Typography,
  IconButton,
} from "@material-tailwind/react";
import { ArrowLeftIcon } from "@heroicons/react/24/solid";
import Swal from "sweetalert2";
import axios from "../../utils/axiosConfig";

const Toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

export function CrearProduccion({ open, handleCreateProductionOpen }) {
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [productionDetails, setProductionDetails] = useState([]);
  const [pedidos, setPedidos] = useState([]);
  const [ventasAsociadas, setVentasAsociadas] = useState([]);

  useEffect(() => {
    if (open) {
      setSelectedVentas([]);
      setProductionDetails([]);
      fetchVentas();
      fetchPedidos();
      fetchVentasAsociadas();
    }
  }, [open]);

  const fetchVentas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      setVentas(response.data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchPedidos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/pedidos");
      setPedidos(response.data);
    } catch (error) {
      console.error("Error fetching pedidos:", error);
    }
  };

  const fetchVentasAsociadas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ordenesproduccion/todas_ventas_asociadas");
      const ventasAsociadas = response.data.map((venta) => venta.numero_venta);
      setVentasAsociadas(ventasAsociadas);
    } catch (error) {
      console.error("Error fetching ventas asociadas:", error);
    }
  };

  const handleVentaChange = (numero_venta, isChecked) => {
    const venta = ventas.find((v) => v.numero_venta === numero_venta);
    if (!venta) return;

    if (isChecked) {
      if (!selectedVentas.includes(numero_venta)) {
        setSelectedVentas([...selectedVentas, numero_venta]);

        const nuevosDetalles = [...productionDetails];
        venta.detalles.forEach((detalle) => {
          const existingDetail = nuevosDetalles.find(
            (d) => d.id_producto === detalle.id_producto
          );
          if (existingDetail) {
            existingDetail.cantidad += detalle.cantidad;
          } else {
            nuevosDetalles.push({
              ...detalle,
              nombre: detalle.nombre || `Producto ${detalle.id_producto}`,
            });
          }
        });

        setProductionDetails(nuevosDetalles);
      }
    } else {
      const nuevasVentasSeleccionadas = selectedVentas.filter(
        (num) => num !== numero_venta
      );
      setSelectedVentas(nuevasVentasSeleccionadas);

      const nuevosDetalles = productionDetails.filter(
        (detalle) =>
          !venta.detalles.some((d) => d.id_producto === detalle.id_producto)
      );
      setProductionDetails(nuevosDetalles);
    }
  };

  const handleCreateProductionSave = async () => {
    const numeroOrdenUnico = `ORD${Math.floor(Math.random() * 1000000)}`;
    const fechaActual = new Date().toISOString().split('T')[0];

    try {
      await axios.post("http://localhost:3000/api/ordenesproduccion", {
        numero_orden: numeroOrdenUnico,
        fecha_orden: fechaActual,
        productos: productionDetails.map(detalle => ({
          id_producto: detalle.id_producto,
          cantidad: detalle.cantidad,
        })),
        numero_ventas: selectedVentas,
      });
      Toast.fire({
        icon: "success",
        title: "Orden de producción creada correctamente.",
      });
      setSelectedVentas([]);
      setProductionDetails([]);
      handleCreateProductionOpen();
    } catch (error) {
      console.error("Error al crear la orden de producción:", error);
      Toast.fire({
        icon: "error",
        title: "Hubo un problema al crear la orden de producción",
      });
    }
  };

  // Filtrar las ventas disponibles para mostrar solo las que no están asociadas
  const ventasFiltradas = ventas.filter((venta) => !ventasAsociadas.includes(venta.numero_venta));

  return (
    <Dialog
      open={open}
      handler={handleCreateProductionOpen}
      className="custom-modal w-screen h-screen"
      size="xxl"
    >
      <div className="flex justify-between items-center p-4">
        <IconButton
          variant="text"
          color="blue-gray"
          size="sm"
          onClick={handleCreateProductionOpen}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </IconButton>
        <Typography variant="h5" color="blue-gray">
          Crear Orden de Producción
        </Typography>
        <div className="w-6"></div> {/* Placeholder para equilibrar el espacio */}
      </div>
      <DialogBody divider className="flex h-[80vh] p-4 gap-6">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <Typography variant="h6" color="blue-gray" className="mb-4 text-sm">
            Seleccionar Ventas para la Orden
          </Typography>
          {ventasFiltradas.map((venta) => (
            <div key={venta.id_venta} className="mb-4">
              <Checkbox
                id={`venta-${venta.id_venta}`}
                label={`Venta ${venta.numero_venta} - Cliente: ${venta.cliente.nombre} - Documento: ${venta.cliente.numero_documento}`}
                onChange={(e) =>
                  handleVentaChange(venta.numero_venta, e.target.checked)
                }
                checked={selectedVentas.includes(venta.numero_venta)}
              />
            </div>
          ))}
        </div>

        <div className="w-full max-w-xs bg-gray-100 p-4 rounded-lg shadow-md max-h-[80vh] overflow-y-auto">
          <Typography variant="h6" color="blue-gray" className="mb-4 text-lg">
            Resumen de Producción
          </Typography>
          <ul className="list-disc pl-4 text-sm">
            {productionDetails.map((detalle, index) => (
              <li key={index} className="mb-2">
                {detalle.nombre}: Cantidad {detalle.cantidad}
              </li>
            ))}
          </ul>
        </div>
      </DialogBody>
      <DialogFooter className="bg-white p-4 flex justify-end gap-2">
        <Button
          variant="text"
          className="btncancelarm"
          size="sm"
          onClick={handleCreateProductionOpen}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm"
          size="sm"
          onClick={handleCreateProductionSave}
        >
          Crear orden
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default CrearProduccion;
