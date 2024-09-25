import React, { useState } from 'react';
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

export function CrearPedido({ clientes, productos, fetchPedidos, onCancel }) {
  const generateUniqueOrderNumber = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let orderNumber = '';
    for (let i = 0; i < 10; i++) {
      orderNumber += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return orderNumber;
  };

  const [selectedPedido, setSelectedPedido] = useState({
    id_cliente: "",
    numero_pedido: generateUniqueOrderNumber(),
    fecha_entrega: "",
    fecha_pago: "",
    id_estado: 7,
    detallesPedido: [],
    clientesh: { nombre: "", contacto: "" },
    total: 0 // Agregar total al estado
  });

  const [errors, setErrors] = useState({});

  const validateFields = () => {
    const newErrors = {};
    if (!selectedPedido.id_cliente) {
      newErrors.id_cliente = "El cliente es obligatorio";
    }
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
      if (!detalle.cantidad || isNaN(detalle.cantidad) || detalle.cantidad <= 0) {
        newErrors[`cantidad_${index}`] = "La cantidad debe ser un número positivo";
      }
      if (!detalle.precio_unitario || isNaN(detalle.precio_unitario) || detalle.precio_unitario <= 0) {
        newErrors[`precio_unitario_${index}`] = "El precio unitario debe ser un número positivo";
      }
    });
    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedValue = name === 'id_cliente' ? value : value.trim();
    
    // Update state
    setSelectedPedido({ ...selectedPedido, [name]: updatedValue });
    
    // Validate fields
    validateFields();
  };

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedPedido.detallesPedido];

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

    setSelectedPedido({ ...selectedPedido, detallesPedido: detalles });
    updateTotal(detalles);

    // Validate fields
    validateFields();
  };

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
    const total = detalles.reduce((acc, detalle) => acc + (detalle.subtotal || 0), 0);
    setSelectedPedido(prevState => ({
      ...prevState,
      total
    }));
  };

 

  const handleSave = async () => {
    // Validaciones previas
    const newErrors = {};
    if (!selectedPedido.id_cliente) {
      newErrors.id_cliente = "El cliente es obligatorio";
    }
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
  
    setErrors(newErrors);
  
    if (Object.keys(newErrors).length > 0) {
      // Si hay errores, no se guarda el pedido
      return;
    }
  
    const pedidoToSave = {
      id_cliente: parseInt(selectedPedido.id_cliente),
      numero_pedido: selectedPedido.numero_pedido,
      fecha_entrega: new Date(selectedPedido.fecha_entrega).toISOString(),
      fecha_pago: selectedPedido.pagado && selectedPedido.fecha_pago ? new Date(selectedPedido.fecha_pago).toISOString() : null,
      estado: selectedPedido.pagado ? "Pendiente de Preparación" : "Esperando Pago",
      pagado: selectedPedido.pagado,
      detallesPedido: selectedPedido.detallesPedido.map(detalle => ({
        id_producto: parseInt(detalle.id_producto),
        cantidad: parseInt(detalle.cantidad),
        precio_unitario: parseFloat(detalle.precio_unitario),
        subtotal: parseFloat(detalle.subtotal) // Incluyendo el subtotal
      })),
      total: selectedPedido.total // Incluyendo el total
    };
  
    try {
      await axios.post("http://localhost:3000/api/pedidos", pedidoToSave);
      Toast.fire({
        title: '¡Creación exitosa!',
        text: 'El pedido ha sido creado correctamente.',
        icon: 'success',
      });
      fetchPedidos(); // Actualizar la lista de pedidos
      onCancel(); // Regresar a la lista de pedidos
    } catch (error) {
      console.error("Error saving pedido:", error);
      Toast.fire({
        title: 'Error',
        text: 'Hubo un problema al guardar el pedido.',
        icon: 'error',
      });
    }
  };
  

  return (
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex gap-4 mb-4">
        <div className="flex flex-col gap-4 w-1/2 pr-4 bg-white rounded-lg shadow-sm p-4">
          <div
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: '#000000',
              marginBottom: '0.5rem',
            }}
          >
            Crear Pedido
          </div>
          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-gray-700">Cliente:</label>
            <Select
              name="id_cliente"
              value={selectedPedido.id_cliente}
              onChange={(e) => handleChange({ target: { name: 'id_cliente', value: e } })}
              className="w-full text-xs"
              required
            >
              {clientes
                .filter(cliente => cliente.estado)
                .map(cliente => (
                  <Option key={cliente.id_cliente} value={cliente.id_cliente}>
                    {`${cliente.nombre} - ${cliente.numero_documento}`} {/* Mostrar nombre y número de documento */}
                  </Option>
                ))}
            </Select>
            {errors.id_cliente && (
              <p className="text-red-500 text-xs mt-1">{errors.id_cliente}</p>
            )}
          </div>

          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-gray-700">Nro. Pedido:</label>
            <Input
              label="Número de Pedido"
              name="numero_pedido"
              type="text"
              value={selectedPedido.numero_pedido}
              onChange={handleChange}
              className="w-full text-xs"
              disabled
            />
          </div>

          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-gray-700">Fecha de Entrega:</label>
            <Input
             
              name="fecha_entrega"
              type="date"
              value={selectedPedido.fecha_entrega}
              onChange={handleChange}
              className="w-full text-xs"
              required
            />
            {errors.fecha_entrega && (
              <p className="text-red-500 text-xs mt-1">{errors.fecha_entrega}</p>
            )}
          </div>

          <div className="w-full max-w-xs">
            <label className="block text-sm font-medium text-gray-700">Fecha de Pago:</label>
            <Input
             
              name="fecha_pago"
              type="date"
              value={selectedPedido.fecha_pago}
              onChange={handleChange}
              className="w-full text-xs"
              disabled={!selectedPedido.pagado}
            />
          </div>

          
        </div>

       
        
        <div className="mt-6 text-center">
        <Typography variant="h6" color="blue-gray" className="font-semibold mb-4">
    Detalles del Pedido
  </Typography>

  {selectedPedido.detallesPedido.map((detalle, index) => (
    <div key={index} className="flex flex-col gap-4 mb-1 p-4 bg-gray-50 rounded-md shadow-sm border border-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        {/* Producto y Cantidad en la misma fila */}
        <div className="flex flex-col md:w-1/2 gap-2">
          <label className="block text-sm font-medium text-gray-700">Producto:</label>
          <Select
            name="id_producto"
            value={detalle.id_producto}
            onChange={(e) => handleDetalleChange(index, { target: { name: 'id_producto', value: e } })}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-0"
            required
          >
            {productos
              .filter(producto => producto.estado)
              .map(producto => (
                <Option key={producto.id_producto} value={producto.id_producto}>
                  {producto.nombre}
                </Option>
              ))}
          </Select>
          {errors[`producto_${index}`] && (
            <p className="text-red-500 text-xs mt-1">{errors[`producto_${index}`]}</p>
          )}
        </div>

        <div className="flex flex-col md:w-1/2 gap-2">
          <label className="block text-sm font-medium text-gray-700">Cantidad:</label>
          <Input
            name="cantidad"
            type="number"
            value={detalle.cantidad}
            onChange={(e) => handleDetalleChange(index, e)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-0"
            required
          />
          {errors[`cantidad_${index}`] && (
            <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>
          )}
        </div>
      </div>

      {/* Precio Unitario y Subtotal en la misma fila */}
      <div className="flex flex-col md:flex-row gap-4 mt-4">
        <div className="flex flex-col md:w-1/2 gap-2">
          <label className="block text-sm font-medium text-gray-700">Precio Unitario:</label>
          <Input
            name="precio_unitario"
            type="number"
            value={detalle.precio_unitario}
            onChange={(e) => handleDetalleChange(index, e)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:border-blue-500 focus:ring-0"
            required
          />
          {errors[`precio_unitario_${index}`] && (
            <p className="text-red-500 text-xs mt-1">{errors[`precio_unitario_${index}`]}</p>
          )}
        </div>

        <div className="flex flex-col md:w-1/2 gap-2">
          <label className="block text-sm font-medium text-gray-700">Subtotal:</label>
          <input
            name="subtotal"
            type="text"
            value={`$${(detalle.subtotal || 0).toFixed(2)}`}
            readOnly
            className="w-full p-2 bg-gray-100 border border-gray-300 rounded-md text-sm"
          />
        </div>
      </div>

      {/* Botón de eliminar (Trash Icon) alineado a la derecha */}
      <div className="flex justify-end mt-2">
        <IconButton
          color="red"
          onClick={() => handleRemoveDetalle(index)}
          className="mt-4"
        >
          <TrashIcon className="h-5 w-5" />
        </IconButton>
      </div>
    </div>
  ))}

  {errors.detallesPedido && (
    <p className="text-red-500 text-xs mb-4">{errors.detallesPedido}</p>
  )}

  {/* Botón para agregar detalle */}
  <div className="flex items-center mt-4">
    <Button
      size="sm"
      onClick={handleAddDetalle}
      className="flex items-center gap-2 bg-black text-white hover:bg-pink-800 px-4 py-2 rounded-md"
    >
      <PlusIcon className="h-5 w-5" />
      <span className="sr-only">Agregar Detalle</span>
    </Button>
  </div>



  <div className="flex justify-end mt-4">
  <Typography variant="h6" color="blue-gray">
  Total de la Compra: ${(selectedPedido.total  || 0).toFixed(2)}
  </Typography>      
          </div>
        </div>
      </div>

      <div className="bg-white p-4 flex justify-end gap-4 border-t border-gray-200">
  <Button
    variant="text"
    size="sm"
    onClick={onCancel}
    className="btncancelarm text-white"
  >
    Cancelar
  </Button>
  <Button
    variant="gradient"
    size="sm"
    onClick={handleSave}
    className="btnagregarm text-white"
  >
    Crear Pedido
  </Button>
</div>

    </div>
  );
}
