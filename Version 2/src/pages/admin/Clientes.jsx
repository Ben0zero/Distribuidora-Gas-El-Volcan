const KPI = [
    { icono: 'bi-people-fill', color: 'bg-primary text-white', titulo: 'Clientes Totales', valor: '846' },
    { icono: 'bi-person-plus', color: 'bg-success text-white', titulo: 'Nuevos este Mes', valor: '24' },
    { icono: 'bi-house-door', color: 'bg-info text-dark', titulo: 'Residenciales', valor: '575' },
    { icono: 'bi-shop', color: 'bg-warning text-dark', titulo: 'Comerciales', valor: '271' },
]

const CLIENTES = [
    { nombre: 'Juan Pérez', correo: 'juan.perez@gmail.com', comuna: 'Chillán', tipo: 'Residencial', compras: 18, ultimaCompra: '2026-10-09', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'Restaurante El Fogón', correo: 'contacto@elfogon.cl', comuna: 'San Ignacio', tipo: 'Comercial', compras: 42, ultimaCompra: '2026-10-08', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'María González', correo: 'maria.gonzalez@duoc.cl', comuna: 'Chillán Viejo', tipo: 'Residencial', compras: 11, ultimaCompra: '2026-10-09', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'Taller Mecánico Díaz', correo: 'taller.diaz@gmail.com', comuna: 'El Carmen', tipo: 'Comercial', compras: 27, ultimaCompra: '2026-10-07', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'Pedro Soto', correo: 'pedro.soto@gmail.com', comuna: 'Bulnes', tipo: 'Residencial', compras: 6, ultimaCompra: '2026-10-09', estado: 'Nuevo', badge: 'bg-primary' },
    { nombre: 'Camila Rojas', correo: 'camila.rojas@duoc.cl', comuna: 'Pinto', tipo: 'Residencial', compras: 9, ultimaCompra: '2026-10-08', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'Panadería La Espiga', correo: 'ventas@laespiga.cl', comuna: 'Chillán', tipo: 'Comercial', compras: 35, ultimaCompra: '2026-09-30', estado: 'Activo', badge: 'bg-success' },
    { nombre: 'Jorge Muñoz', correo: 'jorge.munoz@gmail.com', comuna: 'Quillón', tipo: 'Residencial', compras: 3, ultimaCompra: '2026-08-14', estado: 'Inactivo', badge: 'bg-secondary' },
]

const MEJORES_CLIENTES = [
    { nombre: 'Restaurante El Fogón', total: '$1.680.000', icono: 'bi-trophy-fill', color: 'text-warning' },
    { nombre: 'Panadería La Espiga', total: '$1.225.000', icono: 'bi-award-fill', color: 'text-secondary' },
    { nombre: 'Taller Mecánico Díaz', total: '$842.500', icono: 'bi-award-fill', color: 'text-danger' },
]

const POR_COMUNA = [
    { comuna: 'Chillán', porcentaje: 48, color: 'bg-primary' },
    { comuna: 'Chillán Viejo', porcentaje: 18, color: 'bg-info' },
    { comuna: 'Bulnes', porcentaje: 11, color: 'bg-success' },
    { comuna: 'San Ignacio', porcentaje: 9, color: 'bg-warning' },
    { comuna: 'Otras comunas', porcentaje: 14, color: 'bg-secondary' },
]


function Clientes() {
    return <></>
}

export default Clientes