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

export function EditarProduccion({ open, handleEditProductionOpen, orden }) {
  const [ventas, setVentas] = useState([]);
  const [selectedVentas, setSelectedVentas] = useState([]);
  const [productionDetails, setProductionDetails] = useState([]);
  const [ventasAsociadas, setVentasAsociadas] = useState([]);
  const [ventasAsociadasActuales, setVentasAsociadasActuales] = useState([]);
  const [dataLoaded, setDataLoaded] = useState(false); // Estado para manejar la carga de datos
  const [ventasFiltradas, setVentasFiltradas] = useState([]); // Estado para ventas filtradas

  useEffect(() => {
    if (open) {
      setSelectedVentas([]);
      setProductionDetails([]);
      setDataLoaded(false);
      fetchVentas();
    }
  }, [open]);

  useEffect(() => {
    if (ventas.length > 0 && !dataLoaded) {
      fetchVentasAsociadas().then(() => {
        loadOrderDetails();
      });
    }
  }, [ventas, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      aplicarFiltradoDeVentas();
    }
  }, [dataLoaded, ventas, ventasAsociadas, ventasAsociadasActuales]);

  const fetchVentas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ventas");
      setVentas(response.data);
    } catch (error) {
      console.error("Error fetching ventas:", error);
    }
  };

  const fetchVentasAsociadas = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/ordenesproduccion/todas_ventas_asociadas");
      const ventasAsociadas = response.data.map(venta => venta.numero_venta);
      setVentasAsociadas(ventasAsociadas);
    } catch (error) {
      console.error("Error fetching ventas asociadas:", error);
    }
  };

  const obtenerNombreProducto = async (id_producto) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/productos/${id_producto}`);
      return response.data.nombre; // Asegúrate de que la API de productos devuelva el nombre
    } catch (error) {
      console.error("Error fetching product name:", error);
      return `Producto ${id_producto}`; // Fallback si no se encuentra el producto
    }
  };
  
  const loadOrderDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/api/ordenesproduccion/${orden.id_orden}/ventas_asociadas`);
      const ventasAsociadas = response.data.map(venta => venta.numero_venta);
      setSelectedVentas(ventasAsociadas);
      setVentasAsociadasActuales(ventasAsociadas);
  
      const detallesProduccion = await Promise.all(
        ventasAsociadas.flatMap(async numero_venta => {
          const venta = ventas.find(v => v.numero_venta === numero_venta);
          if (venta) {
            return await Promise.all(venta.detalles.map(async detalle => ({
              id_producto: detalle.id_producto,
              cantidad: detalle.cantidad,
              nombre: await obtenerNombreProducto(detalle.id_producto), // Llamar a la API para obtener el nombre
            })));
          }
          return [];
        })
      );
  
      setProductionDetails(detallesProduccion.flat());
      setDataLoaded(true); // Marcar los datos como cargados
    } catch (error) {
      console.error("Error loading order details:", error);
    }
  };
  

  const aplicarFiltradoDeVentas = () => {
    const filtradas = ventas.filter(venta =>
      !ventasAsociadas.includes(venta.numero_venta) || ventasAsociadasActuales.includes(venta.numero_venta)
    );
    setVentasFiltradas(filtradas); // Aplicar el filtrado de ventas
  };

  const handleVentaChange = (numero_venta, isChecked) => {
    const venta = ventas.find(v => v.numero_venta === numero_venta);

    if (!venta) {
      console.log("Venta no encontrada para:", numero_venta);
      return;
    }

    const detallesVenta = venta.detalles.map(detalle => ({
      id_producto: detalle.id_producto,
      cantidad: detalle.cantidad,
      nombre: detalle.nombre || `Producto ${detalle.id_producto}`,
    }));

    if (isChecked) {
      agregarProductos(detallesVenta);
      setSelectedVentas(prevState => [...prevState, numero_venta]);
    } else {
      quitarProductos(detallesVenta);
      setSelectedVentas(prevState => prevState.filter(num => num !== numero_venta));
    }
  };

  const agregarProductos = (productos) => {
    const nuevosDetalles = [...productionDetails];

    productos.forEach((detalle) => {
      const existingDetail = nuevosDetalles.find(d => d.id_producto === detalle.id_producto);
      if (existingDetail) {
        existingDetail.cantidad += detalle.cantidad;
      } else {
        nuevosDetalles.push(detalle);
      }
    });

    setProductionDetails(nuevosDetalles);
  };

  const quitarProductos = (productos) => {
    const nuevosDetalles = [...productionDetails];

    productos.forEach((detalle) => {
      const existingDetail = nuevosDetalles.find(d => d.id_producto === detalle.id_producto);
      if (existingDetail) {
        existingDetail.cantidad -= detalle.cantidad;
        if (existingDetail.cantidad <= 0) {
          const index = nuevosDetalles.indexOf(existingDetail);
          if (index > -1) {
            nuevosDetalles.splice(index, 1);
          }
        }
      }
    });

    setProductionDetails(nuevosDetalles);
  };

  const handleUpdateProductionSave = async () => {
    const updatedOrder = {
      fecha_orden: new Date().toISOString().split('T')[0],
      productos: productionDetails.map(detalle => ({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
      })),
      numero_ventas: selectedVentas,
    };

    try {
      await axios.put(`http://localhost:3000/api/ordenesproduccion/${orden.id_orden}`, updatedOrder);
      Swal.fire({
        icon: "success",
        title: "Orden de producción actualizada correctamente",
      });
      handleEditProductionOpen();
    } catch (error) {
      console.error("Error al actualizar la orden de producción:", error);
      Swal.fire({
        icon: "error",
        title: "Hubo un problema al actualizar la orden de producción",
      });
    }
  };

  return (
    <Dialog
      open={open}
      handler={handleEditProductionOpen}
      className="custom-modal w-screen h-screen"
      size="xxl"
    >
      <div className="flex justify-between items-center p-4">
        <IconButton
          variant="text"
          color="blue-gray"
          size="sm"
          onClick={handleEditProductionOpen}
        >
          <ArrowLeftIcon className="h-6 w-6" />
        </IconButton>
        <Typography variant="h5" color="blue-gray">
          Editar Orden de Producción
        </Typography>
        <div className="w-6"></div>
      </div>
      <DialogBody divider className="flex h-[80vh] p-4 gap-6">
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto">
          <Typography variant="h6" color="blue-gray" className="mb-4 text-sm">
            Seleccionar Ventas para la Orden
          </Typography>
          {ventasFiltradas.map(venta => (
            <div key={venta.numero_venta} className="mb-4">
              <Checkbox
                id={`venta-${venta.numero_venta}`}
                label={`Venta ${venta.numero_venta} - Cliente: ${venta.cliente.nombre} - Documento: ${venta.cliente.numero_documento}`}
                onChange={(e) => handleVentaChange(venta.numero_venta, e.target.checked)}
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
                {detalle.nombre}: {detalle.cantidad}
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
          onClick={handleEditProductionOpen}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm"
          size="sm"
          onClick={handleUpdateProductionSave}
        >
          Guardar Cambios
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

export default EditarProduccion;
