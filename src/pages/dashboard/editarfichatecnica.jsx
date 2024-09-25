import {
  DialogBody,
  DialogFooter,
  Typography,
  Input,
  Textarea,
  Button,
  IconButton,
} from "@material-tailwind/react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import axios from "../../utils/axiosConfig";

export function EditarFichaTecnica({ handleClose, fetchFichas, ficha, productos, insumos }) {
  const [selectedFicha, setSelectedFicha] = useState(ficha);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setSelectedFicha(ficha);
  }, [ficha]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedFicha({ ...selectedFicha, [name]: value });
    setErrors({ ...errors, [name]: "" });
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

  const handleDetalleChange = (index, e) => {
    const { name, value } = e.target;
    const detalles = [...selectedFicha.detallesFichaTecnicat];
    detalles[index][name] = value;
    setSelectedFicha({ ...selectedFicha, detallesFichaTecnicat: detalles });
    setErrors({ ...errors, [`${name}_${index}`]: "" });
  };

  const hasDuplicateInsumos = () => {
    const insumosIds = selectedFicha.detallesFichaTecnicat.map(detalle => detalle.id_insumo);
    return insumosIds.some((id, index) => insumosIds.indexOf(id) !== index);
  };

  const handleAddDetalle = () => {
    if (hasDuplicateInsumos()) {
      Toast.fire({
        icon: 'error',
        title: 'No se pueden agregar insumos duplicados.'
      });
      return;
    }
  
    setSelectedFicha({
      ...selectedFicha,
      detallesFichaTecnicat: [...selectedFicha.detallesFichaTecnicat, { id_insumo: "", cantidad: "" }]
    });
  };
  

  const handleRemoveDetalle = (index) => {
    const detalles = [...selectedFicha.detallesFichaTecnicat];
    detalles.splice(index, 1);
    setSelectedFicha({ ...selectedFicha, detallesFichaTecnicat: detalles });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!selectedFicha.id_producto) newErrors.id_producto = "El producto es requerido";
    if (!selectedFicha.descripcion) newErrors.descripcion = "La descripción es requerida";
    if (!selectedFicha.insumos) newErrors.insumos = "Los insumos son requeridos";
    
    selectedFicha.detallesFichaTecnicat.forEach((detalle, index) => {
      if (!detalle.id_insumo) newErrors[`id_insumo_${index}`] = "El insumo es requerido";
      if (!detalle.cantidad) newErrors[`cantidad_${index}`] = "La cantidad es requerida";
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    const fichaToSave = {
      ...selectedFicha,
      detallesFichaTecnica: selectedFicha.detallesFichaTecnicat,
    };

    try {
      await axios.put(`http://localhost:3000/api/fichastecnicas/${selectedFicha.id_ficha}`, fichaToSave);
      Toast.fire({
        icon: 'success',
        title: '¡Actualización exitosa! La ficha técnica ha sido actualizada correctamente.'
      });
      fetchFichas();
      handleClose();
    } catch (error) {
      console.error("Error saving ficha:", error);
      if (error.response && error.response.data && error.response.data.errors) {
        setErrors(error.response.data.errors);
      } else {
        setErrors({ general: "Hubo un problema al guardar la ficha técnica." });
      }
    }
  };    

  return (
    <div className="flex flex-col gap-6 p-6 bg-gray-50 rounded-lg shadow-lg">
      <div
        style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#000000',
          marginBottom: '0.5rem',
        }}
      >
        Editar Ficha Técnica
      </div>

      <DialogBody divider className="flex flex-row max-h-[80vh] overflow-hidden">
        {/* Sección Izquierda */}
        <div className="flex flex-col gap-4 w-1/2 pr-4 bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700">Producto:</label>
            <select
              className="w-full max-w-[400px] p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
              name="id_producto"
              required
              value={selectedFicha.id_producto}
              onChange={handleChange}
            >
              <option value="">Seleccione un producto</option>
              {productos.filter(producto => producto.estado).map(producto => (
                <option key={producto.id_producto} value={producto.id_producto}>
                  {producto.nombre}
                </option>
              ))}
            </select>
            {errors.id_producto && <p className="text-red-500 text-xs mt-1">{errors.id_producto}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700">Descripción de la ficha técnica:</label>
            <Textarea
              name="descripcion"
              required
              value={selectedFicha.descripcion}
              onChange={handleChange}
              rows={3}
              className="text-sm w-full max-w-[400px] resize-none border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0"
            />
            {errors.descripcion && <p className="text-red-500 text-xs mt-1">{errors.descripcion}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <label className="block text-sm font-medium text-gray-700">Descripción detallada de los insumos:</label>
            <Textarea
              name="insumos"
              required
              value={selectedFicha.insumos}
              onChange={handleChange}
              rows={3}
              className="text-sm w-full max-w-[400px] resize-none border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-0"
            />
            {errors.insumos && <p className="text-red-500 text-xs mt-1">{errors.insumos}</p>}
          </div>
        </div>

        {/* Sección Derecha */}
        <div className="flex flex-col gap-4 w-1/2 overflow-y-auto p-4 bg-white rounded-lg shadow-sm">
          <Typography variant="h6" color="blue-gray" className="text-lg font-semibold">
            Detalles de Insumos
          </Typography>

          <div className="flex flex-col gap-4">
            {selectedFicha.detallesFichaTecnicat.map((detalle, index) => (
              <div key={index} className="flex items-center gap-4 mb-4 p-4 bg-gray-100 rounded-lg shadow-sm">
                <div className="flex flex-col w-2/3 gap-2">
                  <label className="block text-sm font-medium text-gray-700">Insumo:</label>
                  <select
                    className="w-full max-w-[200px] p-2 border border-gray-300 rounded-lg text-sm focus:border-blue-500 focus:ring-0"
                    name="id_insumo"
                    value={detalle.id_insumo}
                    required
                    onChange={(e) => handleDetalleChange(index, e)}
                  >
                    <option value="">Seleccione un insumo</option>
                    {insumos.filter(insumo => insumo.estado).map(insumo => (
                      <option key={insumo.id_insumo} value={insumo.id_insumo}>
                        {insumo.nombre}
                      </option>
                    ))}
                  </select>
                  {errors[`id_insumo_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`id_insumo_${index}`]}</p>}
                </div>

                <div className="flex flex-col w-1/3 gap-2">
                  <label className="block text-sm font-medium text-gray-700">Cantidad:</label>
                  <input
                    name="cantidad"
                    required
                    type="number"
                    value={detalle.cantidad}
                    onChange={(e) => handleDetalleChange(index, e)}
                    className="text-sm w-full max-w-[120px] border border-gray-300 focus:border-blue-500 focus:ring-0 rounded-lg p-2"
                  />
                  {errors[`cantidad_${index}`] && <p className="text-red-500 text-xs mt-1">{errors[`cantidad_${index}`]}</p>}
                </div>

                <div className="flex items-center justify-center w-10">
                <IconButton
                color="red"
                  onClick={() => handleRemoveDetalle(index)}                 
                  size="sm"
                >
                  <TrashIcon className="w-5 h-5" />
                </IconButton>
              </div>
              </div>
            ))}
          </div>

          <div className="flex items-center">
          <Button
            onClick={handleAddDetalle}
            size="sm"
            className="flex items-center gap-2 bg-black text-white hover:bg-pink-800 px-2 py-1 rounded-md"
            style={{ width: 'auto' }}
         >
           <PlusIcon className="h-5 w-5" />
           <span className="sr-only">Agregar Detalle</span>
          </Button>
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="bg-white p-4 flex justify-end gap-4 border-t border-gray-200">
        <Button
          variant="text"
          size="sm"
          onClick={handleClose}
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
          Guardar Cambios
        </Button>
      </DialogFooter>
    </div>
  );
}