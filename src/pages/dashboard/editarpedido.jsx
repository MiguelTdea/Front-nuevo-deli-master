import React, { useState, useEffect } from 'react';
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
import Swal from 'sweetalert2';

// Función para formatear la fecha en formato YYYY-MM-DD
const formatDate = (isoDate) => {
  return isoDate ? new Date(isoDate).toISOString().substring(0, 10) : '';
};

export function EditarPedido({ pedido, clientes = [], productos = [], fetchPedidos, onCancel }) {
  const [selectedPedido, setSelectedPedido] = useState({
    id_cliente: "",
    numero_pedido: "",
    fecha_entrega: "",
    fecha_pago: "",
    id_estado: 7,  // Estado inicial: Esperando Pago
    detallesPedido: [], // Aseguramos que siempre sea un array
    clientesh: { nombre: "", contacto: "" },
    total: 0 // Agregar total al estado
  });

  const [ventas, setVentas] = useState([]); // Estado para almacenar las ventas
  const [loadingVentas, setLoadingVentas] = useState(true); // Estado de carga para ventas
  const [clienteNombre, setClienteNombre] = useState(""); // Para almacenar el nombre del cliente
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchVentas = async () => {
      try {
        const response = await axios.get("http://localhost:3000/api/ventas");
        setVentas(response.data); // Actualiza el estado con las ventas obtenidas
        setLoadingVentas(false); // Termina la carga
      } catch (error) {
        console.error("Error fetching ventas:", error);
        setLoadingVentas(false); // Termina la carga incluso si hay error
      }
    };

    fetchVentas();

    if (pedido) {
      if (pedido.id_estado !== 7) {
        Swal.fire({
          title: 'No se puede editar',
          text: 'Solo se pueden editar pedidos con estado "Esperando Pago".',
          icon: 'warning',
          confirmButtonText: 'Aceptar'
        }).then(() => {
          onCancel(); // Regresar a la vista anterior si no es estado 7
        });
        return;
      }

      const detallesConSubtotal = pedido.detallesPedido.map(detalle => {
        const producto = productos.find(p => p.id_producto === detalle.id_producto);
        const precioUnitario = producto ? producto.precio : 0;
        const cantidad = detalle.cantidad;
        const subtotal = cantidad * precioUnitario;
        return { ...detalle, precio_unitario: precioUnitario, subtotal };
      });

      // Obtener el nombre del cliente
      const cliente = clientes.find(cliente => cliente.id_cliente === pedido.id_cliente);
      setClienteNombre(cliente ? cliente.nombre : "");

      setSelectedPedido({
        ...pedido,
        fecha_entrega: formatDate(pedido.fecha_entrega), // Formatear la fecha de entrega
        fecha_pago: formatDate(pedido.fecha_pago), // Formatear la fecha de pago si existe
        detallesPedido: detallesConSubtotal, // Añadir los subtotales
        id_estado: pedido.id_estado,  // Cargar el estado actual del pedido
        clientesh: pedido.clientesh || { nombre: "", contacto: "" },
        total: calcularTotal(detallesConSubtotal) // Calcular el total al cargar el pedido
      });
    }
  }, [pedido, productos, clientes, onCancel]);

  // Función para calcular el total del pedido basado en los detalles
  const calcularTotal = (detalles) => {
    return detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedPedido({ ...selectedPedido, [name]: value });
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedPedido.detallesPedido];

    if (name === 'id_producto') {
      const productoSeleccionado = productos.find(p => p.id_producto === parseInt(value));
      if (productoSeleccionado) {
        detalles[index].precio_unitario = productoSeleccionado.precio; // Establecer el precio unitario basado en el producto seleccionado
        detalles[index].subtotal = detalles[index].cantidad * productoSeleccionado.precio; // Calcular el subtotal
      }
    }

    detalles[index][name] = value;

    if (name === 'cantidad' || name === 'precio_unitario') {
      const cantidad = parseInt(detalles[index].cantidad) || 0;
      const precioUnitario = parseFloat(detalles[index].precio_unitario) || 0;
      detalles[index].subtotal = cantidad * precioUnitario;
    }

    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);
  };

  const handleAddDetalle = () => {
    setSelectedPedido({
      ...selectedPedido,
      detallesPedido: [...selectedPedido.detallesPedido, { id_producto: "", cantidad: "", precio_unitario: "", subtotal: 0 }]
    });
  };

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedPedido.detallesPedido];
    detalles.splice(index, 1);
    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);
  };

  const updateTotal = (detalles) => {
    const total = calcularTotal(detalles);
    setSelectedPedido(prevState => ({
      ...prevState,
      total
    }));
  };

  const handleSave = async () => {
    // Validaciones previas
    const newErrors = {};
    if (!selectedPedido.fecha_entrega) {
      newErrors.fecha_entrega = "La fecha de entrega es obligatoria";
    }
    if (selectedPedido.detallesPedido.length === 0) {
      newErrors.detallesPedido = "Debe agregar al menos un detalle de pedido";
    }
    selectedPedido.detallesPedido.forEach((detalle, index) => {
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
        title: 'Error',
        text: 'Por favor, complete todos los campos requeridos.',
        icon: 'error',
      });
      return;
    }
  
    // Nueva lógica para verificar si la cantidad total de productos vendidos en la fecha excede el límite
    const fechaEntrega = selectedPedido.fecha_entrega;
  
    // Calcular la cantidad total de productos vendidos para la fecha de entrega seleccionada
    const cantidadTotalVendidaEnFecha = ventas
      .filter(venta => venta.fecha_entrega.split('T')[0] === fechaEntrega)
      .reduce((acc, venta) => {
        return acc + venta.detalles.reduce((sum, detalle) => sum + detalle.cantidad, 0);
      }, 0);
  
    // Calcular la cantidad de la nueva compra (pedido)
    const cantidadNuevaCompra = selectedPedido.detallesPedido.reduce((acc, detalle) => acc + parseInt(detalle.cantidad), 0);
  
    const cantidadTotalFinal = cantidadTotalVendidaEnFecha + cantidadNuevaCompra;
    const disponibilidadRestante = 2000 - cantidadTotalVendidaEnFecha;
  
    // Si supera el límite, mostrar alerta
    if (cantidadTotalFinal > 2000) {
      Swal.fire({
        title: "Error",
        text: `La cantidad total de productos para la fecha ${fechaEntrega} excede el límite de 2000 unidades. Actualmente, solo puedes agregar ${disponibilidadRestante} unidades más.`,
        icon: "error",
      });
      return;
    }
  
    // Incluir numero_pedido e id_cliente en el cuerpo de la solicitud
    const pedidoToSave = {
      id_cliente: selectedPedido.id_cliente, // Incluir id_cliente
      numero_pedido: selectedPedido.numero_pedido, // Incluir numero_pedido
      fecha_entrega: new Date(selectedPedido.fecha_entrega).toISOString(),
      fecha_pago: selectedPedido.fecha_pago ? new Date(selectedPedido.fecha_pago).toISOString() : null,
      id_estado: selectedPedido.id_estado, // Guardar el nuevo estado seleccionado
      detallesPedido: selectedPedido.detallesPedido.map(detalle => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
        subtotal: parseFloat(detalle.subtotal) // Incluyendo el subtotal
      })),
      total: selectedPedido.total // Incluyendo el total
    };
  
    try {
      await axios.put(`http://localhost:3000/api/pedidos/${selectedPedido.id_pedido}`, pedidoToSave);
      Swal.fire({
        title: '¡Actualización exitosa!',
        text: 'El pedido ha sido actualizado correctamente.',
        icon: 'success',
      });
      fetchPedidos(); // Actualizar la lista de pedidos
      onCancel(); // Regresar a la lista de pedidos
    } catch (error) {
      console.error("Error updating pedido:", error);
      Swal.fire({
        title: 'Error',
        text: 'Hubo un problema al actualizar el pedido.',
        icon: 'error',
      });
    }
  };
  

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded-lg shadow-md">
      <Typography className="text-black p-2 text-lg mb-4">Editar Pedido</Typography>
      <div className="flex flex-col gap-4">
        {/* Mostrar el nombre del cliente */}
        <div className="w-full max-w-xs">
          <Input
            label="Cliente"
            name="cliente_nombre"
            type="text"
            value={clienteNombre}
            className="w-full"
            disabled
          />
        </div>
        <div className="w-full max-w-xs">
          <Input
            label="Número de Pedido"
            name="numero_pedido"
            type="text"
            value={selectedPedido.numero_pedido}
            className="w-full"
            disabled
          />
        </div>
        <div className="w-full max-w-xs">
          <Input
            label="Fecha de Entrega"
            name="fecha_entrega"
            type="date"
            value={selectedPedido.fecha_entrega}
            onChange={handleChange}
            className="w-full"
            required
          />
        </div>
        <div className="w-full max-w-xs">
          <Input
            label="Fecha de Pago"
            name="fecha_pago"
            type="date"
            value={selectedPedido.fecha_pago ? selectedPedido.fecha_pago : ""}
            onChange={handleChange}
            className="w-full"
          />
        </div>

        {/* Select para cambiar el estado a "Pagado" */}
        <div className="w-full max-w-xs">
          <Select
            label="Estado del Pedido"
            name="id_estado"
            value={selectedPedido.id_estado}
            onChange={(e) => setSelectedPedido({ ...selectedPedido, id_estado: parseInt(e) })}
            className="w-full"
          >
            <Option value={7}>Esperando Pago</Option>
            <Option value={6}>Pagado</Option>
          </Select>
        </div>

        <Typography variant="h6" color="black" className="text-ms">
          Agregar Productos
        </Typography>

        <div className="bg-gray-100 p-4 rounded-lg shadow-md flex flex-col gap-2">
          {selectedPedido.detallesPedido.map((detalle, index) => (
            <div key={index} className="relative flex flex-col gap-2 mb-4">
              <div className="flex flex-col gap-2">
                <Select
                  label="Producto"
                  required
                  name="id_producto"
                  value={detalle.id_producto}
                  onChange={(e) => handleDetalleChange(index, { target: { name: 'id_producto', value: e } })}
                  className="w-full"
                >
                  {productos.map(producto => (
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
            Total: ${selectedPedido.total.toFixed(2)}
          </Typography>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="text" className="btncancelarm" size="sm" onClick={onCancel}>
          Cancelar
        </Button>
        <Button variant="gradient" className="btnagregarm" size="sm" onClick={handleSave}>
          Guardar Cambios
        </Button>
      </div>
    </div>
  );
}
