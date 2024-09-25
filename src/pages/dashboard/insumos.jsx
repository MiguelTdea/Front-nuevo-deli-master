import {
  Card,
  CardBody,
  Typography,
  Button,
  Dialog,
  DialogHeader,
  DialogBody,
  DialogFooter,
  Input,
  IconButton,
  Select,
  Option,
} from "@material-tailwind/react";
import { PlusIcon, PencilIcon, TrashIcon, EyeIcon } from "@heroicons/react/24/solid";
import { useState, useEffect } from "react";
import axios from "../../utils/axiosConfig";
import Swal from 'sweetalert2';

export function Insumos() {
  const [insumos, setInsumos] = useState([]);
  const [filteredInsumos, setFilteredInsumos] = useState([]);
  const [open, setOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedInsumo, setSelectedInsumo] = useState({
    nombre: "",
    stock_actual: 0,
    unidad_medida: "", // Nuevo campo para unidad de medida
    id_categoria: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [insumosPerPage] = useState(8);
  const [search, setSearch] = useState("");
  const [errors, setErrors] = useState({});
  const [categorias, setCategorias] = useState([]);

  useEffect(() => {
    fetchInsumos();
    fetchCategorias();
  }, []);

  const fetchInsumos = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/insumos");
      setInsumos(response.data);
      setFilteredInsumos(response.data);
    } catch (error) {
      console.error("Error fetching insumos:", error);
    }
  };

  const fetchCategorias = async () => {
    try {
      const response = await axios.get("http://localhost:3000/api/categorias_insumo");
      setCategorias(response.data);
    } catch (error) {
      console.error("Error fetching categorias:", error);
    }
  };

  useEffect(() => {
    filterInsumos();
  }, [search, insumos]);

  const filterInsumos = () => {
    const filtered = insumos.filter((insumo) =>
      insumo.nombre.toLowerCase().includes(search.toLowerCase())
    );
    setFilteredInsumos(filtered);
  };

  const handleOpen = () => {
    setOpen(!open);
    setErrors({});
  };

  const handleDetailsOpen = () => {
    setDetailsOpen(!detailsOpen);
  };

  const handleEdit = (insumo) => {
    setSelectedInsumo(insumo);
    setEditMode(true);
    setOpen(true);
  };

  const handleCreate = () => {
    setSelectedInsumo({
      nombre: "",
      stock_actual: 0,
      unidad_medida: "", // Asegurar que el campo esté vacío en la creación
      id_categoria: "",
    });
    setEditMode(false);
    setOpen(true);
  };

  const handleDelete = async (insumo) => {
    const result = await Swal.fire({
      title: '¿Estás seguro?',
      text: `¿Estás seguro de que deseas eliminar el insumo ${insumo.nombre}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#000000',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
      try {
        await axios.delete(`http://localhost:3000/api/insumos/${insumo.id_insumo}`);
        fetchInsumos();
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          }
        });
        Toast.fire({
          icon: "success",
          title: "Insumo eliminado exitosamente."
        });
      } catch (error) {
        console.error("Error deleting insumo:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al eliminar',
          text: 'El insumo no se puede eliminar ya que se encuentra asociado a una categoría de insumo y/o a una ficha técnica.',
          confirmButtonText: 'Aceptar',
          background: '#ffff',
          iconColor: '#A62A64',
          confirmButtonColor: '#000000',
          customClass: {
            title: 'text-lg font-semibold',
            icon: 'text-2xl',
            confirmButton: 'px-4 py-2 text-white'
          }
        });
      }
    }
  };

  const handleSave = async () => {
    try {
      const regex = /^[a-zA-ZáéíóúüÁÉÍÓÚÜ\s]+$/;
      const errors = {};

      if (!selectedInsumo.nombre.trim()) {
        errors.nombre = "Por favor, ingrese el nombre del insumo";
      } else if (!regex.test(selectedInsumo.nombre)) {
        errors.nombre = "El nombre del insumo solo puede contener letras y espacios";
      }

      if (!selectedInsumo.id_categoria) {
        errors.id_categoria = "Por favor, ingrese la categoría del insumo";
      }

      if (!selectedInsumo.unidad_medida) {
        errors.unidad_medida = "Por favor, seleccione la unidad de medida";
      }

      if (Object.keys(errors).length > 0) {
        setErrors(errors);
        return;
      }

      if (editMode) {
        await axios.put(`http://localhost:3000/api/insumos/${selectedInsumo.id_insumo}`, selectedInsumo);
        setOpen(false);
        fetchInsumos(); // Refrescar la lista de insumos
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          }
        });
        Toast.fire({
          icon: "success",
          title: "Insumo editado exitosamente"
        });
      } else {
        await axios.post("http://localhost:3000/api/insumos", selectedInsumo);
        fetchInsumos();
        setOpen(false);
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          }
        });
        Toast.fire({
          icon: "success",
          title: "Insumo creado exitosamente"
        });
      }
    } catch (error) {
      console.error("Error saving insumo:", error);
      Swal.fire('Error', 'Hubo un problema al guardar el insumo.', 'error');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSelectedInsumo({ ...selectedInsumo, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleViewDetails = (insumo) => {
    setSelectedInsumo(insumo);
    setDetailsOpen(true);
  };
  
  const handleToggleEstado = async (insumo) => {
    const estado = !insumo.estado;
    const accion = estado ? 'activar' : 'desactivar';
  
    const result = await Swal.fire({
      title: `¿Estás seguro?`,
      text: `¿Deseas ${accion} el insumo?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#A62A64',
      cancelButtonColor: '#000000',
      confirmButtonText: `Sí, ${accion} el insumo`,
      cancelButtonText: 'Cancelar'
    });
  
    if (result.isConfirmed) {
      try {
        if (!estado) { // Solo verificamos si intentamos desactivar el insumo
          // Verificar si el insumo está asociado a una ficha técnica
          const fichasResponse = await axios.get(`http://localhost:3000/api/fichastecnicas`);
          const fichasTecnicas = fichasResponse.data.filter(ficha => ficha.insumos.includes(insumo.id_insumo));
  
          if (fichasTecnicas.length > 0) {
            Swal.fire({
              icon: 'warning',
              title: 'No se puede desactivar el insumo',
              text: `El insumo está asociado a ${fichasTecnicas.length} ficha(s) técnica(s).`,
              confirmButtonColor: '#A62A64',
              background: '#fff',
              confirmButtonText: 'Aceptar'
            });
            return;
          }
        }
  
        // Si no está asociado a ninguna ficha técnica, o si se está activando el insumo, proceder con el cambio de estado
        await axios.patch(`http://localhost:3000/api/insumos/${insumo.id_insumo}/estado`, {
          estado: estado
        });
  
        fetchInsumos();
  
        const Toast = Swal.mixin({
          toast: true,
          position: "top-end",
          showConfirmButton: false,
          timer: 3000,
          timerProgressBar: true,
          didOpen: (toast) => {
            toast.onmouseenter = Swal.stopTimer;
            toast.onmouseleave = Swal.resumeTimer;
          }
        });
  
        Toast.fire({
          icon: "success",
          title: `Insumo ${estado ? 'activado' : 'desactivado'} exitosamente`
        });
      } catch (error) {
        console.error("Error al cambiar el estado del insumo:", error);
        Swal.fire({
          icon: 'error',
          title: 'Error al cambiar el estado',
          text: 'El insumo no se puede cambiar de estado debido a un error.',
          confirmButtonText: 'Aceptar',
          background: '#ffff',
          iconColor: '#A62A64',
          confirmButtonColor: '#000000',
          customClass: {
            title: 'text-lg font-semibold',
            icon: 'text-2xl',
            confirmButton: 'px-4 py-2 text-white'
          }
        });
      }
    }
  };
  
  
  
  

  const indexOfLastInsumo = currentPage * insumosPerPage;
  const indexOfFirstInsumo = indexOfLastInsumo - insumosPerPage;
  const currentInsumos = filteredInsumos.slice(indexOfFirstInsumo, indexOfLastInsumo);

  const pageNumbers = [];
  for (let i = 1; i <= Math.ceil(filteredInsumos.length / insumosPerPage); i++) {
    pageNumbers.push(i);
  }

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <>
      <div className="relative h-20 w-full overflow-hidden rounded-xl bg-cover bg-center">
      <div className="absolute inset-0 h-full w-full bg-white-900/75" />
      </div>


      <Card className="mx-3 -mt-16 mb-6 lg:mx-4 border border-blue-gray-100">
  <CardBody className="p-4">
  <div className="flex items-center justify-between mb-6">
  <Button 
    onClick={handleCreate} 
    className="btnagregar w-40" // Ajusta el ancho horizontal del botón
    size="sm" 
    startIcon={<PlusIcon  />}
  >
    Crear Insumo
  </Button>
  <input
  type="text"
  placeholder="Buscar por nombre de Insumo..."
  value={search}
  onChange={handleSearchChange}
  className="ml-[28rem] border border-gray-300 rounded-md focus:border-blue-500 appearance-none shadow-none py-2 px-4 text-sm" // Ajusta el padding vertical y horizontal
  style={{ width: '250px' }} // Ajusta el ancho del campo de búsqueda
/>
</div>


          <div className="mb-1">
            <Typography variant="h5" color="blue-gray" className="mb-4">
              Lista de Insumos
            </Typography>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock Actual
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Unidad de Medida
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Categoría
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentInsumos.map((insumo) => (
                    <tr key={insumo.id_insumo}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {insumo.nombre}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {insumo.stock_actual}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {insumo.unidad_medida}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {insumo.categoriaInsumo?.nombre || 'N/A'} {/* Aquí mostramos solo la propiedad `nombre` de `categoriaInsumo` */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button
                          onClick={() => handleToggleEstado(insumo)}
                          className={`relative inline-flex items-center h-6 w-12 rounded-full p-1 duration-300 ease-in-out ${
                            insumo.estado
                              ? 'bg-gradient-to-r from-green-800 to-green-600 hover:from-green-600 hover:to-green-400 shadow-lg'
                              : 'bg-gradient-to-r from-red-800 to-red-500 hover:from-red-600 hover:to-red-400 shadow-lg'
                          }`}
                        >
                          <span
                            className={`inline-block w-5 h-5 transform bg-white rounded-full shadow-md transition-transform duration-300 ease-in-out ${
                              insumo.estado ? 'translate-x-5' : 'translate-x-1'
                            }`}
                          />
                          <span
                            className={`absolute left-1 flex items-center text-xs text-white font-semibold ${
                              insumo.estado ? 'opacity-0' : 'opacity-100'
                            }`}
                          />
                          <span
                            className={`absolute right-1 flex items-center text-xs text-white font-semibold ${
                              insumo.estado ? 'opacity-100' : 'opacity-0'
                            }`}
                          />
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-1">
                          <IconButton
                            className="btnedit"
                            size="sm"
                            onClick={() => handleEdit(insumo)}
                            disabled={!insumo.estado}
                          >
                            <PencilIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="btncancelarinsumo"
                            size="sm"
                            color="red"
                            onClick={() => handleDelete(insumo)}
                            disabled={!insumo.estado}
                          >
                            <TrashIcon className="h-4 w-4" />
                          </IconButton>
                          <IconButton
                            className="btnvisualizar"
                            size="sm"
                            onClick={() => handleViewDetails(insumo)}
                            
                          >
                            <EyeIcon className="h-4 w-4" />
                          </IconButton>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4">
              <ul className="flex justify-center items-center space-x-2">
                {pageNumbers.map((number) => (
                  <Button
                    key={number}
                    onClick={() => paginate(number)}
                    className={`pagination ${number === currentPage ? 'active' : ''}`}
                    size="sm"
                  >
                    {number}
                  </Button>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>

      <Dialog open={open} handler={handleOpen} className="max-w-md w-11/12 p-6 bg-white rounded-lg shadow-lg" size="xs">
        <DialogHeader className="text-lg font-semibold text-gray-800 border-b border-gray-200 pb-4">
          {editMode ? "Editar Insumo" : "Crear Insumo"}
        </DialogHeader>
        <DialogBody divider className="space-y-4">
          <div>
            <Input
              label="Nombre de insumo"
              name="nombre"
              value={selectedInsumo.nombre}
              onChange={handleChange}
              required
              error={errors.nombre}
              className="rounded-lg border-gray-300"
            />
            {errors.nombre && <Typography className="text-red-500 mt-1 text-sm">{errors.nombre}</Typography>}
          </div>
          <div>
            <Select
              label="Categoría"
              name="id_categoria"
              value={selectedInsumo.id_categoria}
              onChange={(e) => setSelectedInsumo({ ...selectedInsumo, id_categoria: e })}
              required
              error={errors.id_categoria}
              className="rounded-lg border-gray-300"
            >
              {categorias.filter(categoria => categoria.estado).map((categoria) => (
                <Option key={categoria.id_categoria} value={categoria.id_categoria}>
                  {categoria.nombre}
                </Option>
              ))}
            </Select>
            {errors.id_categoria && <Typography className="text-red-500 mt-1 text-sm">{errors.id_categoria}</Typography>}
          </div>
          <div>
            <Select
              label="Unidad de Medida"
              name="unidad_medida"
              value={selectedInsumo.unidad_medida}
              onChange={(e) => setSelectedInsumo({ ...selectedInsumo, unidad_medida: e })}
              required
              error={errors.unidad_medida}
              className="rounded-lg border-gray-300"
            >
              <Option value="Gramos">Gramos</Option>
              <Option value="Mililitros">Mililitros</Option>
              <Option value="Unidad">Unidad</Option>
            </Select>
            {errors.unidad_medida && <Typography className="text-red-500 mt-1 text-sm">{errors.unidad_medida}</Typography>}
          </div>
        </DialogBody>
        <DialogFooter className="flex justify-end pt-4">
          <Button variant="text" className="btncancelarm" size="sm" onClick={handleOpen}>
            Cancelar
          </Button>
          <Button variant="gradient" className="btnagregarm" size="sm" color="green" onClick={handleSave}>
            {editMode ? "Guardar Cambios" : "Crear Insumo"}
          </Button>
        </DialogFooter>
      </Dialog>

      <Dialog open={detailsOpen} handler={handleDetailsOpen} className="max-w-xs w-11/12 bg-white rounded-lg shadow-lg" size="xs">
        <DialogHeader className="text-xl font-bold text-gray-800">
          Detalles del Insumo
        </DialogHeader>
        <DialogBody className="space-y-2">
          <div className="space-y-1">
            <Typography variant="subtitle2" className="font-bold text-gray-800">Nombre:</Typography>
            <Typography className="text-sm">{selectedInsumo.nombre}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Stock Actual:</Typography>
            <Typography className="text-sm">{selectedInsumo.stock_actual}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Unidad de Medida:</Typography>
            <Typography className="text-sm">{selectedInsumo.unidad_medida}</Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Categoría:</Typography>
            <Typography className="text-sm">
              {selectedInsumo.categoriaInsumo?.nombre || 'N/A'} {/* Asegurar renderizar sólo el nombre */}
            </Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Creado:</Typography>
            <Typography className="text-sm">
              {selectedInsumo.createdAt ? new Date(selectedInsumo.createdAt).toLocaleString() : 'N/A'}
            </Typography>
            <Typography variant="subtitle2" className="font-bold text-gray-800">Actualizado:</Typography>
            <Typography className="text-sm">
              {selectedInsumo.updatedAt ? new Date(selectedInsumo.updatedAt).toLocaleString() : 'N/A'}
            </Typography>
          </div>
        </DialogBody>
        <DialogFooter className="flex justify-center">
          <Button className="btncancelarm" size="sm" onClick={handleDetailsOpen}>
            Cerrar
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}