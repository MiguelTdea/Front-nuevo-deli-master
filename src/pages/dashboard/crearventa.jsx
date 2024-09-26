import React, { useState, useEffect } from "react";
import {
  Button,
  Input,
  Select,
  Option,
  IconButton,
  Typography
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import axios from "../../utils/axiosConfig";
import Swal from "sweetalert2";

export function CrearVenta({ clientes, productos, fetchVentas, onCancel }) {
  const [selectedVenta, setSelectedVenta] = useState({
    id_cliente: "",
    numero_venta: "",
    fecha_venta: "",
    fecha_entrega: "",
    id_estado: 2,
    detalleVentas: [],
    cliente: { nombre: "", contacto: "" },
    total: 0, // Inicializar total
    subtotal: 0 // Inicializar subtotal
  });

  const [errors, setErrors] = useState({});
  const [pedidos, setPedidos] = useState([]); // Estado para almacenar los pedidos
  const [loadingPedidos, setLoadingPedidos] = useState(true); // Estado de carga

  // useEffect para obtener los pedidos de la API cuando el componente se monte
  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/pedidos");
        setPedidos(response.data); // Actualiza el estado con los pedidos obtenidos
        setLoadingPedidos(false); // Termina la carga
      } catch (error) {
        console.error("Error fetching pedidos:", error);
        setLoadingPedidos(false); // Termina la carga incluso si hay error
      }
    };

    fetchPedidos();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedVenta({ ...selectedVenta, [name]: value });
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedVenta.detalleVentas];

    if (name === 'id_producto') {
      const productoSeleccionado = productos.find(p => p.id_producto === parseInt(value));
      detalles[index].precio_unitario = productoSeleccionado ? productoSeleccionado.precio : "";
    }

    detalles[index][name] = value;

    if (name === 'cantidad' || name === 'precio_unitario') {
      const cantidad = parseInt(detalles[index].cantidad) || 0;
      const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
      detalles[index].subtotal = cantidad * precioUnitario;
    }

    setSelectedVenta({ ...selectedVenta, detalleVentas: detalles });
    updateTotal(detalles);
  };

  const handleAddDetalle = () => {
    setSelectedVenta({
      ...selectedVenta,
      detalleVentas: [...selectedVenta.detalleVentas, { id_producto: "", cantidad: "", precio_unitario: "", subtotal: 0 }]
    });
  };

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedVenta.detalleVentas];
    detalles.splice(index, 1);
    setSelectedVenta({ ...selectedVenta, detalleVentas: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const total = detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
    setSelectedVenta(prevState => ({
      ...prevState,
      total
    }));
  };

  const handlePedidoChange = (numero_pedido) => {
    console.log("Número de pedido seleccionado:", numero_pedido);
    const pedido = pedidos.find(p => p.numero_pedido === numero_pedido);
    if (pedido) {
      console.log("Pedido encontrado:", pedido);
      const detalles = pedido.detallesPedido.map(detalle => ({
        id_producto: detalle.id_producto,
        cantidad: detalle.cantidad,
        precio_unitario: parseFloat(productos.find(p => p.id_producto === detalle.id_producto)?.precio || 0),
        subtotal: parseFloat(productos.find(p => p.id_producto === detalle.id_producto)?.precio || 0) * detalle.cantidad
      }));
      setSelectedVenta({
        ...selectedVenta,
        id_cliente: pedido.id_cliente,
        numero_venta: pedido.numero_pedido,
        fecha_venta: pedido.fecha_pago ? pedido.fecha_pago.split('T')[0] : "",
        fecha_entrega: pedido.fecha_entrega ? pedido.fecha_entrega.split('T')[0] : "",
        detalleVentas: detalles
      });
      updateTotal(detalles);
    } else {
      console.log("No se encontró el pedido con el número:", numero_pedido);
    }
  };

  const handleSave = async () => {
    const newErrors = {};
    if (!selectedVenta.id_cliente) {
      newErrors.id_cliente = "El cliente es obligatorio";
    }
    if (!selectedVenta.fecha_venta) {
      newErrors.fecha_venta = "La fecha de venta es obligatoria";
    }
    if (selectedVenta.detalleVentas.length === 0) {
      newErrors.detalleVentas = "Debe agregar al menos un detalle de venta";
    }
    selectedVenta.detalleVentas.forEach((detalle, index) => {
      if (!detalle.id_producto) {
        newErrors[`producto_${index}`] = "El producto es obligatorio";
      }
      if (!detalle.cantidad) {
        newErrors[`cantidad_${index}`] = "La cantidad es obligatoria";
      }
    });
  
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      Swal.fire({
        title: "Error",
        text: "Por favor, complete todos los campos requeridos.",
        icon: "error",
      });
      return;
    }
  
    // Nueva lógica para verificar si la cantidad total de productos vendidos en la fecha supera el límite
    const fechaEntrega = selectedVenta.fecha_entrega;
    const cantidadTotalEnFecha = pedidos
      .filter(pedido => pedido.fecha_entrega.split('T')[0] === fechaEntrega)
      .reduce((acc, pedido) => acc + pedido.detallesPedido.reduce((sum, detalle) => sum + detalle.cantidad, 0), 0);
  
    const cantidadNuevaVenta = selectedVenta.detalleVentas.reduce((acc, detalle) => acc + parseInt(detalle.cantidad), 0);
    const cantidadTotalFinal = cantidadTotalEnFecha + cantidadNuevaVenta;
    const disponibilidadRestante = 2000 - cantidadTotalEnFecha;
  
    // Si supera el límite, mostrar alerta
    if (cantidadTotalFinal > 2000) {
      Swal.fire({
        title: "Error",
        text: `La cantidad total de productos para la fecha ${fechaEntrega} excede el límite de 2000 unidades. Actualmente, solo puedes vender ${disponibilidadRestante} unidades más.`,
        icon: "error",
      });
      return;
    }
  
    // Si no supera el límite, continuar guardando la venta
    const ventaToSave = {
      id_cliente: parseInt(selectedVenta.id_cliente),
      numero_venta: selectedVenta.numero_venta || `VENTA-${Date.now()}`, // Generar número de venta si no se selecciona pedido
      fecha_venta: new Date(selectedVenta.fecha_venta).toISOString(),
      fecha_entrega: new Date(selectedVenta.fecha_entrega).toISOString(),
      estado: selectedVenta.estado,
      pagado: selectedVenta.pagado,
      detalleVentas: selectedVenta.detalleVentas.map((detalle) => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
        subtotal: parseFloat(detalle.subtotal)
      })),
      total: selectedVenta.total,
      subtotal: selectedVenta.subtotal
    };
  
    try {
      await axios.post("http://localhost:3000/api/ventas", ventaToSave);
      Swal.fire({
        title: "¡Creación exitosa!",
        text: "La venta ha sido creada correctamente.",
        icon: "success",
      });
      fetchVentas();
      onCancel();
    } catch (error) {
      console.error("Error saving venta:", error);
      Swal.fire({
        title: "Error",
        text: "Hubo un problema al guardar la venta.",
        icon: "error",
      });
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: '0.5rem',
        }}
      >
        Crear Venta
      </div>
      <div className="flex gap-8">
        <div className="w-1/2 flex flex-col gap-4">
          {/* Mostrar un mensaje de carga mientras se obtienen los pedidos */}
          {loadingPedidos ? (
            <Typography variant="h6" color="blue">
              Cargando pedidos...
            </Typography>
          ) : (
            <div className="w-full max-w-xs">
              <Select
                label="Número de Pedido"
                name="numero_venta"
                value={selectedVenta.numero_venta}
                onChange={(value) => handlePedidoChange(value)}
                className="w-full text-xs"
              >
                {pedidos
                  .filter(pedido => pedido.id_estado === 6) // Filtrar pedidos con estado "pagado"
                  .map(pedido => (
                    <Option key={pedido.numero_pedido} value={pedido.numero_pedido}>
                      {pedido.numero_pedido}
                    </Option>
                  ))}
              </Select>
            </div>
          )}

          <div className="w-full max-w-xs">
            <Select
              label="Cliente"
              name="id_cliente"
              value={selectedVenta.id_cliente}
              onChange={(e) => handleChange({ target: { name: "id_cliente", value: e } })}
              className="w-full text-xs"
              required
            >
              {clientes
                .filter((cliente) => cliente.estado)
                .map((cliente) => (
                  <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {`${cliente.nombre} - ${cliente.numero_documento}`}
                  </Option>
                ))}
            </Select>
          </div>
          <div className="w-full max-w-xs">
            <Input
              label="Fecha de Venta"
              name="fecha_venta"
              type="date"
              value={selectedVenta.fecha_venta}
              onChange={handleChange}
              className="w-full text-xs"
              required
            />
          </div>
          <div className="w-full max-w-xs">
            <Input
              label="Fecha de Entrega"
              name="fecha_entrega"
              type="date"
              value={selectedVenta.fecha_entrega}
              onChange={handleChange}
              className="w-full text-xs"
              required
            />
          </div>
        </div>

        <div className="w-1/2 flex flex-col gap-4">
          <Typography variant="h6" color="black">
            Agregar Productos
          </Typography>

          <div className="bg-gray-100 p-4 rounded-lg shadow-md flex flex-col gap-2">
            {selectedVenta.detalleVentas.map((detalle, index) => (
              <div key={index} className="relative flex flex-col gap-2 mb-4">
                <div className="flex flex-col gap-2">
                  <Select
                    label="Producto"
                    required
                    name="id_producto"
                    value={detalle.id_producto}
                    onChange={(e) => handleDetalleChange(index, { target: { name: "id_producto", value: e } })}
                    className="w-full"
                  >
                    {productos.map((producto) => (
                      <Option key={producto.id_producto} value={producto.id_producto}>
                        {producto.nombre}
                      </Option>
                    ))}
                  </Select>
                  <Input
                    label="Cantidad"
                    name="cantidad"
                    type="number"
                    required
                    value={detalle.cantidad}
                    onChange={(e) => handleDetalleChange(index, e)}
                    className="w-full"
                  />
                  <Input
                    label="Precio Unitario"
                    name="precio_unitario"
                    type="number"
                    step="0.01"
                    value={detalle.precio_unitario}
                    className="w-full"
                    readOnly
                  />
                  <Input
                    label="Subtotal"
                    name="subtotal"
                    type="number"
                    step="0.01"
                    value={detalle.subtotal}
                    className="w-full"
                    readOnly
                  />
                  <div className="flex justify-end">
                    <IconButton
                      color="red"
                      onClick={() => handleRemoveDetalle(index)}
                      className="btncancelarm"
                      size="sm"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </IconButton>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-2 flex justify-end">
              <Button className="btnmas" size="sm" onClick={handleAddDetalle}>
                <PlusIcon className="h-4 w-4 mr-1" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Typography variant="h6" color="black">
              Total: ${selectedVenta.total.toFixed(2)}
            </Typography>
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button
          variant="text"
          className="btncancelarm"
          size="sm"
          onClick={onCancel}
        >
          Cancelar
        </Button>
        <Button
          variant="gradient"
          className="btnagregarm"
          size="sm"
          onClick={handleSave}
        >
          Crear Venta
        </Button>
      </div>
    </div>
  );
}
