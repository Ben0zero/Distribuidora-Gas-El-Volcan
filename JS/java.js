(function () {
    'use strict';

    var PRODUCTOS = [
        { id: 'p1', codigo: 'CL001', nombre: 'Cilindro GLP 5 kg', descripcion: 'Cilindro de gas licuado de petróleo 5 kg. Para uso residencial (cocina, calefacción pequeña).', residencial: 6500, comercial: 6000, stock: 80, stockCritico: 5, categoria: 'Cilindros de Gas', imagen: 'IMAGENES/cilindro de 5 K.png' },
        { id: 'p2', codigo: 'CL002', nombre: 'Cilindro GLP 11 kg', descripcion: 'Cilindro estándar doméstico. El más utilizado en hogares chilenos.', residencial: 12000, comercial: 11000, stock: 200, stockCritico: 5, categoria: 'Cilindros de Gas', imagen: 'IMAGENES/cilindro de 11K.png' },
        { id: 'p3', codigo: 'CL003', nombre: 'Cilindro GLP 15 kg', descripcion: 'Cilindro de mayor capacidad para hogares de alto consumo o locales pequeños.', residencial: 16000, comercial: 14500, stock: 90, stockCritico: 5, categoria: 'Cilindros de Gas', imagen: 'IMAGENES/cilindro de 15K.png' },
        { id: 'p4', codigo: 'CL004', nombre: 'Cilindro GLP 45 kg', descripcion: 'Cilindro industrial. Uso comercial: restaurantes, talleres, locales.', residencial: 45000, comercial: 40000, stock: 30, stockCritico: 5, categoria: 'Cilindros de Gas', imagen: 'IMAGENES/cilindro de 45K.png' },
        { id: 'p5', codigo: 'RG001', nombre: 'Regulador doméstico estándar', descripcion: 'Regulador de 1 etapa para cilindros 5, 11 y 15 kg. Presión de salida 28 mbar.', residencial: 8990, comercial: 8200, stock: 45, stockCritico: 5, categoria: 'Reguladores', imagen: 'IMAGENES/Regulador Standar.png' },
        { id: 'p6', codigo: 'RG002', nombre: 'Regulador de alta presión', descripcion: 'Regulador para cocinas industriales o equipos de mayor consumo. Presión regulable.', residencial: 18990, comercial: 17000, stock: 12, stockCritico: 5, categoria: 'Reguladores', imagen: 'IMAGENES/Regaulador de Alta presion.png' },
        { id: 'p7', codigo: 'RG003', nombre: 'Regulador dual (2 salidas)', descripcion: 'Permite conectar dos artefactos simultáneamente al mismo cilindro.', residencial: 14990, comercial: 13500, stock: 18, stockCritico: 5, categoria: 'Reguladores', imagen: 'IMAGENES/Regulador Dual.png' },
        { id: 'p8', codigo: 'MG001', nombre: 'Manguera gas 1.5 m', descripcion: 'Manguera flexible homologada. Diámetro interior 9 mm.', residencial: 3990, comercial: 3500, stock: 80, stockCritico: 5, categoria: 'Mangueras y Conexiones', imagen: 'IMAGENES/Manguera gas 1.5 m.png' },
        { id: 'p9', codigo: 'MG002', nombre: 'Manguera gas 3 m', descripcion: 'Manguera larga para instalaciones donde el artefacto está alejado del cilindro.', residencial: 6990, comercial: 6200, stock: 50, stockCritico: 5, categoria: 'Mangueras y Conexiones', imagen: 'IMAGENES/Manguera gas 3 m.png' },
        { id: 'p10', codigo: 'MG003', nombre: 'Abrazadera metálica', descripcion: 'Abrazadera de acero para asegurar la conexión manguera-regulador.', residencial: 990, comercial: 800, stock: 200, stockCritico: 5, categoria: 'Mangueras y Conexiones', imagen: 'IMAGENES/Abrazadera metálica.png' },
        { id: 'p11', codigo: 'MG004', nombre: 'Kit conexión completo', descripcion: 'Todo lo necesario para instalar un cilindro nuevo.', residencial: 12990, comercial: 11500, stock: 25, stockCritico: 5, categoria: 'Mangueras y Conexiones', imagen: 'IMAGENES/kit completo.png' },
        { id: 'p12', codigo: 'AC001', nombre: 'Carro porta cilindro 11/15 kg', descripcion: 'Carro metálico con ruedas para transportar cilindros con seguridad.', residencial: 12990, comercial: 11000, stock: 20, stockCritico: 5, categoria: 'Accesorios', imagen: 'IMAGENES/carro transportador de gas.png' },
        { id: 'p13', codigo: 'AC002', nombre: 'Tapa protectora para válvula', descripcion: 'Tapa de plástico ABS para proteger la válvula durante el transporte.', residencial: 1490, comercial: 1200, stock: 60, stockCritico: 5, categoria: 'Accesorios', imagen: 'IMAGENES/Tapa de plástico ABS.png' },
        { id: 'p14', codigo: 'AC003', nombre: 'Detector de gas a batería', descripcion: 'Sensor electroquímico. Alarma sonora y visual ante fuga de gas GLP.', residencial: 19990, comercial: 17000, stock: 8, stockCritico: 5, categoria: 'Accesorios', imagen: 'IMAGENES/Sensor electroquímico.png' }
    ];

    var CLAVE_CARRITO = 'carrito';
    var CLAVE_USUARIOS = 'usuarios';
    var CLAVE_PRODUCTOS = 'productos';
    var CLAVE_EDICIONES = 'edicionesProductos';
    var CLAVE_ORDENES = 'ordenes';
    var CLAVE_SESION = 'sesion';

    var ADMIN_DEFAULT = {
        fecha: '2026-05-04',
        run: '19011022',
        nombre: 'Juan Pérez',
        correo: 'admin@duoc.cl',
        contrasena: 'Admin123',
        rol: 'Administrador',
        estado: 'Activo'
    };

    function leer(key) {
        try {
            var valor = JSON.parse(localStorage.getItem(key));
            return Array.isArray(valor) ? valor : [];
        } catch (e) {
            return [];
        }
    }

    function guardar(key, valor) {
        localStorage.setItem(key, JSON.stringify(valor));
    }

    function obtenerUsuarios() {
        return leer(CLAVE_USUARIOS);
    }

    function obtenerSesion() {
        try {
            var valor = JSON.parse(localStorage.getItem(CLAVE_SESION));
            return valor && typeof valor === 'object' ? valor : null;
        } catch (e) {
            return null;
        }
    }

    function tipoSesion() {
        var usuario = obtenerSesion();
        return usuario && usuario.tipoCliente ? usuario.tipoCliente : 'residencial';
    }

    function formatearPrecio(n) {
        return '$' + Number(n).toLocaleString('es-CL');
    }

    function productosCompletos() {
        var ediciones = leer(CLAVE_EDICIONES);
        return PRODUCTOS.map(function (p) {
            var ed = null;
            for (var i = 0; i < ediciones.length; i += 1) {
                if (ediciones[i].id === p.id) {
                    ed = ediciones[i];
                    break;
                }
            }
            if (!ed) {
                return p;
            }
            return {
                id: p.id,
                codigo: ed.codigo || p.codigo,
                nombre: ed.nombre || p.nombre,
                descripcion: ed.descripcion !== undefined ? ed.descripcion : p.descripcion,
                residencial: ed.residencial !== undefined ? ed.residencial : p.residencial,
                comercial: ed.comercial !== undefined ? ed.comercial : p.comercial,
                stock: ed.stock !== undefined ? ed.stock : p.stock,
                stockCritico: ed.stockCritico !== undefined ? ed.stockCritico : p.stockCritico,
                categoria: ed.categoria || p.categoria,
                imagen: ed.imagen || p.imagen
            };
        });
    }

    function obtenerProducto(id) {
        var disponibles = productosCompletos();
        for (var i = 0; i < disponibles.length; i += 1) {
            if (disponibles[i].id === id) {
                return disponibles[i];
            }
        }
        return null;
    }

    function precioResidencialProducto(p) {
        if (p.residencial !== undefined) {
            return p.residencial;
        }
        return p.precio !== undefined ? p.precio : 0;
    }

    function precioComercialProducto(p) {
        if (p.comercial !== undefined) {
            return p.comercial;
        }
        return p.precio !== undefined ? p.precio : precioResidencialProducto(p);
    }

    function precioSegunTipo(producto, tipo) {
        return tipo === 'comercial' ? producto.comercial : producto.residencial;
    }

    function hoyISO() {
        var d = new Date();
        var mes = (d.getMonth() + 1) < 10 ? '0' + (d.getMonth() + 1) : '' + (d.getMonth() + 1);
        var dia = d.getDate() < 10 ? '0' + d.getDate() : '' + d.getDate();
        return d.getFullYear() + '-' + mes + '-' + dia;
    }

    function toast(mensaje, tipo) {
        var contenedor = document.getElementById('toast-contenedor');
        if (!contenedor) {
            contenedor = document.createElement('div');
            contenedor.id = 'toast-contenedor';
            contenedor.setAttribute('style', 'position:fixed;top:16px;right:16px;z-index:9999;display:flex;flex-direction:column;gap:10px;font-family:sans-serif;');
            document.body.appendChild(contenedor);
        }
        var aviso = document.createElement('div');
        var esError = tipo === 'err';
        var color = esError ? '#dc3545' : '#198754';
        aviso.setAttribute('style', 'background:#ffffff;border-left:5px solid ' + color + ';border-radius:8px;' +
            'box-shadow:0 4px 12px rgba(0,0,0,0.2);padding:12px 18px;min-width:240px;max-width:320px;' +
            'color:' + (esError ? '#842029' : '#0f5132') + ';font-size:14px;font-weight:600;');
        aviso.textContent = mensaje;
        contenedor.appendChild(aviso);
        setTimeout(function () {
            aviso.style.opacity = '0';
            aviso.style.transition = 'opacity 0.4s';
        }, 2500);
        setTimeout(function () {
            if (aviso.parentNode) {
                aviso.parentNode.removeChild(aviso);
            }
        }, 3000);
    }

    function validarCorreo(correo) {
        var re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(correo);
    }

    function correoDominioPermitido(correo) {
        var re = /^[^\s@]+@(profesor\.duoc\.cl|duoc\.cl|gmail\.com)$/i;
        return re.test(correo);
    }

    function validarTelefono(telefono) {
        var limpio = String(telefono).replace(/[\s()-]/g, '');
        return /^\+?\d{9,12}$/.test(limpio);
    }

    function validarRun(run) {
        var limpio = String(run).replace(/\s/g, '');
        return /^\d{7,9}$/.test(limpio);
    }

    function asegurarAdminUsuario() {
        var usuarios = obtenerUsuarios();
        var encontrado = false;
        var i;
        for (i = 0; i < usuarios.length; i += 1) {
            if (usuarios[i].correo.toLowerCase() === ADMIN_DEFAULT.correo.toLowerCase()) {
                usuarios[i].run = ADMIN_DEFAULT.run;
                usuarios[i].nombre = ADMIN_DEFAULT.nombre;
                usuarios[i].contrasena = ADMIN_DEFAULT.contrasena;
                usuarios[i].rol = ADMIN_DEFAULT.rol;
                usuarios[i].estado = ADMIN_DEFAULT.estado;
                encontrado = true;
                break;
            }
        }
        if (!encontrado) {
            for (i = 0; i < usuarios.length; i += 1) {
                if (usuarios[i].rol === 'Administrador') {
                    usuarios[i].fecha = ADMIN_DEFAULT.fecha;
                    usuarios[i].run = ADMIN_DEFAULT.run;
                    usuarios[i].nombre = ADMIN_DEFAULT.nombre;
                    usuarios[i].correo = ADMIN_DEFAULT.correo;
                    usuarios[i].contrasena = ADMIN_DEFAULT.contrasena;
                    usuarios[i].rol = ADMIN_DEFAULT.rol;
                    usuarios[i].estado = ADMIN_DEFAULT.estado;
                    encontrado = true;
                    break;
                }
            }
        }
        if (!encontrado) {
            usuarios.push(ADMIN_DEFAULT);
        }
        guardar(CLAVE_USUARIOS, usuarios);
    }

    var REGIONES = [
        { nombre: 'Región de Ñuble', comunas: ['Chillán', 'Chillán Viejo', 'El Carmen', 'Pinto', 'San Ignacio', 'Bulnes', 'Quillón'] }
    ];

    function cargarRegiones() {
        var regionSelect = document.getElementById('region');
        var comunaSelect = document.getElementById('comuna');
        if (!regionSelect || !comunaSelect) {
            return;
        }
        var opcionesRegion = '<option value="" selected disabled>Elige una región...</option>';
        for (var i = 0; i < REGIONES.length; i += 1) {
            opcionesRegion += '<option value="' + REGIONES[i].nombre + '">' + REGIONES[i].nombre + '</option>';
        }
        regionSelect.innerHTML = opcionesRegion;
        comunaSelect.innerHTML = '<option value="" selected disabled>Elige una comuna...</option>';

        regionSelect.addEventListener('change', function () {
            var opcionesComuna = '<option value="" selected disabled>Elige una comuna...</option>';
            for (var r = 0; r < REGIONES.length; r += 1) {
                if (REGIONES[r].nombre === regionSelect.value) {
                    for (var c = 0; c < REGIONES[r].comunas.length; c += 1) {
                        opcionesComuna += '<option value="' + REGIONES[r].comunas[c] + '">' + REGIONES[r].comunas[c] + '</option>';
                    }
                    break;
                }
            }
            comunaSelect.innerHTML = opcionesComuna;
        });

        if (REGIONES.length === 1) {
            regionSelect.value = REGIONES[0].nombre;
            regionSelect.dispatchEvent(new Event('change'));
        }
    }

    function obtenerVecesProducto(carrito, id) {
        for (var i = 0; i < carrito.length; i += 1) {
            if (carrito[i].id === id) {
                return carrito[i].cantidad;
            }
        }
        return 0;
    }

    function obtenerCarrito() {
        return leer(CLAVE_CARRITO);
    }

    function guardarCarrito(carrito) {
        guardar(CLAVE_CARRITO, carrito);
        sincronizarContador();
    }

    function contadorCarrito() {
        var carrito = obtenerCarrito();
        var total = 0;
        for (var i = 0; i < carrito.length; i += 1) {
            total += Number(carrito[i].cantidad) || 0;
        }
        return total;
    }

    function sincronizarContador() {
        var badges = document.querySelectorAll('#contador-carrito');
        var total = contadorCarrito();
        for (var i = 0; i < badges.length; i += 1) {
            if (total > 0) {
                badges[i].textContent = total;
                badges[i].style.display = 'inline-block';
            } else {
                badges[i].textContent = '0';
                badges[i].style.display = 'none';
            }
        }
    }

    function totalCarrito(tipo) {
        var tipoSeleccionado = tipo || 'residencial';
        var carrito = obtenerCarrito();
        var suma = 0;
        for (var i = 0; i < carrito.length; i += 1) {
            var p = obtenerProducto(carrito[i].id);
            if (p) {
                suma += precioSegunTipo(p, tipoSeleccionado) * (Number(carrito[i].cantidad) || 0);
            }
        }
        return suma;
    }

    function agregarAlCarrito(id) {
        var carrito = obtenerCarrito();
        var cantidad = obtenerVecesProducto(carrito, id);
        if (cantidad > 0) {
            carrito = carrito.map(function (item) {
                if (item.id === id) {
                    item.cantidad += 1;
                }
                return item;
            });
        } else {
            carrito.push({ id: id, cantidad: 1 });
        }
        guardarCarrito(carrito);
        toast('Producto agregado al carrito', 'ok');
    }

    function cambiarCantidad(id, delta) {
        var carrito = obtenerCarrito().map(function (item) {
            if (item.id === id) {
                item.cantidad += delta;
            }
            return item;
        }).filter(function (item) {
            return (Number(item.cantidad) || 0) > 0;
        });
        guardarCarrito(carrito);
        actualizarVistasCarrito();
    }

    function eliminarDelCarrito(id) {
        guardarCarrito(obtenerCarrito().filter(function (item) {
            return item.id !== id;
        }));
        actualizarVistasCarrito();
    }

    function vaciarCarrito() {
        guardarCarrito([]);
        actualizarVistasCarrito();
        toast('Carrito vaciado', 'ok');
    }

    function actualizarVistasCarrito() {
        if (document.getElementById('lista-carrito')) {
            renderizarCarrito();
        }
        if (document.getElementById('lista-resumen-pago')) {
            renderizarResumenPago();
        }
    }

    function renderizarCarrito() {
        var contenedor = document.getElementById('lista-carrito');
        if (!contenedor) {
            return;
        }
        var carrito = obtenerCarrito();
        var vacio = document.getElementById('carrito-vacio');
        var resumen = document.getElementById('carrito-resumen');

        if (carrito.length === 0) {
            vacio.classList.remove('d-none');
            resumen.classList.add('d-none');
            return;
        }

        vacio.classList.add('d-none');
        resumen.classList.remove('d-none');

        var html = '';
        for (var i = 0; i < carrito.length; i += 1) {
            var p = obtenerProducto(carrito[i].id);
            if (!p) {
                continue;
            }
            var cantidad = Number(carrito[i].cantidad) || 0;
            var tipo = tipoSesion();
            html += '<div class="row align-items-center border-bottom py-2">' +
                '<div class="col-12 col-md-5 d-flex align-items-center gap-3 mb-2 mb-md-0">' +
                '<img src="' + p.imagen + '" alt="' + p.nombre + '" ' +
                'style="width:60px;height:60px;object-fit:contain;border:1px solid #eee;border-radius:8px;padding:4px;background:#fff;">' +
                '<span class="texto-2 small text-start">' + p.nombre + '</span></div>' +
                '<div class="col-6 col-md-2">' +
                '<div class="d-flex align-items-center gap-2">' +
                '<button type="button" class="btn btn-sm btn-dark rounded-0" data-accion="quitar" data-id="' + p.id + '">−</button>' +
                '<span class="fw-bold">' + cantidad + '</span>' +
                '<button type="button" class="btn btn-sm btn-dark rounded-0" data-accion="agregar" data-id="' + p.id + '">+</button>' +
                '</div></div>' +
                '<div class="col-6 col-md-2 texto-2">' + formatearPrecio(precioSegunTipo(p, tipo)) + '</div>' +
                '<div class="col-6 col-md-2 fw-bold texto-2">' + formatearPrecio(precioSegunTipo(p, tipo) * cantidad) + '</div>' +
                '<div class="col-12 col-md-1 text-md-end text-start mt-2 mt-md-0">' +
                '<button type="button" class="btn btn-sm btn-outline-danger rounded-0" data-accion="eliminar" data-id="' + p.id + '">' +
                '<i class="bi bi-trash"></i></button></div></div>';
        }
        contenedor.innerHTML = html;

        var total = document.getElementById('carrito-total-precio');
        if (total) {
            total.textContent = formatearPrecio(totalCarrito(tipo));
        }
        var notaCarrito = document.getElementById('nota-tarifa-carrito');
        if (notaCarrito) {
            notaCarrito.textContent = tipo === 'comercial'
                ? 'Precios a tarifa comercial aplicados según tu tipo de cliente.'
                : 'Precios a tarifa residencial aplicados según tu tipo de cliente.';
        }
    }

    function iniciarListaCarrito() {
        if (!document.getElementById('lista-carrito')) {
            return;
        }
        document.getElementById('lista-carrito').addEventListener('click', function (evt) {
            var objetivo = evt.target && evt.target.closest ? evt.target.closest('[data-accion]') : null;
            if (!objetivo) {
                return;
            }
            var accion = objetivo.getAttribute('data-accion');
            var id = objetivo.getAttribute('data-id');
            if (accion === 'agregar') {
                cambiarCantidad(id, 1);
            } else if (accion === 'quitar') {
                cambiarCantidad(id, -1);
            } else if (accion === 'eliminar') {
                eliminarDelCarrito(id);
            }
        });

        var botonVaciar = document.getElementById('boton-vaciar-carrito');
        if (botonVaciar) {
            botonVaciar.addEventListener('click', function () {
                vaciarCarrito();
            });
        }
        sincronizarContador();
        renderizarCarrito();
    }

    function iniciarCatalogo() {
        var tarjetas = document.querySelectorAll('.tarjeta-catalogo');
        for (var i = 0; i < tarjetas.length; i += 1) {
            (function (tarjeta) {
                var img = tarjeta.querySelector('img');
                if (!img) {
                    return;
                }
                var ruta = img.getAttribute('src') || '';
                var archivo = decodeURIComponent(ruta.split('/').pop() || '');
                var disponibles = productosCompletos();
                var producto = null;
                for (var j = 0; j < disponibles.length; j += 1) {
                    var archivoProducto = decodeURIComponent((disponibles[j].imagen || '').split('/').pop() || '');
                    if (archivoProducto === archivo) {
                        producto = disponibles[j];
                        break;
                    }
                }
                var boton = tarjeta.querySelector('.btn-login');
                if (producto && boton) {
                    boton.addEventListener('click', function () {
                        agregarAlCarrito(producto.id);
                    });
                }
            })(tarjetas[i]);
        }
        sincronizarContador();
    }

    function iniciarRegistro() {
        var form = document.getElementById('formulario-registro');
        if (!form) {
            return;
        }
        form.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var nombre = document.getElementById('nombre').value.trim();
            var run = document.getElementById('run').value.trim();
            var correo = document.getElementById('correo').value.trim();
            var telefono = document.getElementById('telefono').value.trim();
            var tipo = document.getElementById('tipo-cliente').value;
            var direccion = document.getElementById('direccion').value.trim();
            var region = document.getElementById('region').value;
            var comuna = document.getElementById('comuna').value;
            var password = document.getElementById('password').value;
            var confirmar = document.getElementById('confirmar-password').value;
            var terminos = document.getElementById('terminos').checked;

            if (!nombre) {
                toast('Ingresa tu nombre completo', 'err');
                return;
            }
            if (nombre.length > 100) {
                toast('El nombre no puede superar los 100 caracteres', 'err');
                return;
            }
            if (!validarRun(run)) {
                toast('El RUN debe tener entre 7 y 9 dígitos, sin puntos y sin guion', 'err');
                return;
            }
            if (!correoDominioPermitido(correo)) {
                toast('El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com', 'err');
                return;
            }
            if (!validarTelefono(telefono)) {
                toast('Ingresa un teléfono válido (ej: +56 9 1234 5678)', 'err');
                return;
            }
            if (!tipo) {
                toast('Selecciona tu tipo de cliente', 'err');
                return;
            }
            if (!direccion) {
                toast('Ingresa tu dirección de despacho', 'err');
                return;
            }
            if (!region) {
                toast('Selecciona tu región', 'err');
                return;
            }
            if (!comuna) {
                toast('Selecciona tu comuna de despacho', 'err');
                return;
            }
            if (String(password).length < 4 || String(password).length > 10) {
                toast('La contraseña debe tener entre 4 y 10 caracteres', 'err');
                return;
            }
            if (password !== confirmar) {
                toast('Las contraseñas no coinciden', 'err');
                return;
            }
            if (!terminos) {
                toast('Debes aceptar los términos y condiciones', 'err');
                return;
            }

            var usuarios = obtenerUsuarios();
            for (var i = 0; i < usuarios.length; i += 1) {
                if (usuarios[i].correo.toLowerCase() === correo.toLowerCase()) {
                    toast('Ese correo ya está registrado', 'err');
                    return;
                }
            }

            usuarios.push({
                fecha: hoyISO(),
                run: run,
                nombre: nombre,
                correo: correo,
                telefono: telefono,
                tipoCliente: tipo,
                direccion: direccion,
                region: region,
                comuna: comuna,
                contrasena: password,
                rol: 'Cliente',
                estado: 'Pendiente'
            });
            guardar(CLAVE_USUARIOS, usuarios);
            toast('Cuenta creada correctamente. Ya puedes iniciar sesión.', 'ok');
            setTimeout(function () {
                window.location.href = 'login.html';
            }, 1200);
        });
    }

    function iniciarLogin() {
        var boton = document.getElementById('btn-iniciar-sesion');
        if (!boton) {
            return;
        }
        boton.addEventListener('click', function () {
            var correo = document.getElementById('correo').value.trim();
            var contrasena = document.getElementById('contrasena').value;

            if (!correo || !contrasena) {
                toast('Ingresa tu correo y tu contraseña', 'err');
                return;
            }
            var esAdmin = ADMIN_DEFAULT.correo.toLowerCase() === correo.toLowerCase();
            if (!esAdmin && !correoDominioPermitido(correo)) {
                toast('El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com', 'err');
                return;
            }
            if (String(contrasena).length < 4 || String(contrasena).length > 10) {
                toast('La contraseña debe tener entre 4 y 10 caracteres', 'err');
                return;
            }
            var usuarios = obtenerUsuarios();
            var usuario = null;
            for (var i = 0; i < usuarios.length; i += 1) {
                if (usuarios[i].correo.toLowerCase() === correo.toLowerCase()) {
                    usuario = usuarios[i];
                    break;
                }
            }
            if (!usuario) {
                toast('El correo no está registrado. Créate una cuenta.', 'err');
                return;
            }
            if (usuario.contrasena !== contrasena) {
                toast('Contraseña incorrecta', 'err');
                return;
            }
            guardar(CLAVE_SESION, usuario);
            toast('Bienvenido/a ' + usuario.nombre, 'ok');
            var pendiente = localStorage.getItem('pendiente');
            var destino = usuario.rol === 'Administrador' ? 'admin.html'
                : (pendiente === 'ventas' ? 'ventas.html' : 'index.html');
            if (pendiente) {
                localStorage.removeItem('pendiente');
            }
            setTimeout(function () {
                window.location.href = destino;
            }, 900);
        });
    }

    function iniciarContacto() {
        var form = document.getElementById('form-contacto');
        if (!form) {
            return;
        }
        form.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var nombre = document.getElementById('nombre').value.trim();
            var correo = document.getElementById('correo').value.trim();
            var telefono = document.getElementById('telefono').value.trim();
            var asunto = document.getElementById('asunto').value;
            var mensaje = document.getElementById('mensaje').value.trim();

            if (!nombre) {
                toast('Ingresa tu nombre', 'err');
                return;
            }
            if (!validarCorreo(correo)) {
                toast('Ingresa un correo válido', 'err');
                return;
            }
            if (telefono && !validarTelefono(telefono)) {
                toast('Ingresa un teléfono válido', 'err');
                return;
            }
            if (!asunto || asunto === 'Seleccione una opción') {
                toast('Selecciona un asunto', 'err');
                return;
            }
            if (nombre.length > 100) {
                toast('El nombre no puede superar los 100 caracteres', 'err');
                return;
            }
            if (!mensaje) {
                toast('Escribe tu mensaje', 'err');
                return;
            }
            if (mensaje.length > 500) {
                toast('El mensaje no puede superar los 500 caracteres', 'err');
                return;
            }

            var solicitud = {
                fecha: hoyISO(),
                nombre: nombre,
                correo: correo,
                telefono: telefono,
                asunto: asunto,
                mensaje: mensaje
            };
            var solicitudes = leer('solicitudes');
            solicitudes.push(solicitud);
            guardar('solicitudes', solicitudes);
            form.reset();
            toast('Mensaje enviado. Te contactaremos pronto.', 'ok');
        });
    }

    function iniciarAdminNuevoProducto() {
        var form = document.getElementById('form-nuevo-producto');
        if (!form) {
            return;
        }
        form.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var codigo = document.getElementById('codigo-producto').value.trim();
            var nombre = document.getElementById('nombre-producto').value.trim();
            var descripcion = document.getElementById('descripcion-producto').value.trim();
            var precioRes = parseFloat(document.getElementById('precio-res-producto').value);
            var precioCom = parseFloat(document.getElementById('precio-com-producto').value);
            var stockTexto = document.getElementById('stock-producto').value.trim();
            var stock = parseInt(stockTexto, 10);
            var stockCriticoTexto = document.getElementById('stock-critico').value.trim();
            var stockCritico = stockCriticoTexto ? parseInt(stockCriticoTexto, 10) : 0;
            var categoria = document.getElementById('categoria-producto').value;

            if (codigo.length < 3) {
                toast('El código debe tener al menos 3 caracteres', 'err');
                return;
            }
            if (!nombre) {
                toast('Ingresa el nombre del producto', 'err');
                return;
            }
            if (nombre.length > 100) {
                toast('El nombre no puede superar los 100 caracteres', 'err');
                return;
            }
            if (isNaN(precioRes) || precioRes < 0 || isNaN(precioCom) || precioCom < 0) {
                toast('Ingresa precios válidos (residencial y comercial)', 'err');
                return;
            }
            if (!/^\d+$/.test(stockTexto)) {
                toast('El stock debe ser un entero mayor o igual a 0', 'err');
                return;
            }
            if (stockCriticoTexto && !/^\d+$/.test(stockCriticoTexto)) {
                toast('El stock crítico debe ser un entero', 'err');
                return;
            }
            if (!categoria) {
                toast('Selecciona una categoría', 'err');
                return;
            }

            var productos = leer(CLAVE_PRODUCTOS);
            for (var i = 0; i < productos.length; i += 1) {
                if (productos[i].codigo.toLowerCase() === codigo.toLowerCase()) {
                    toast('Ya existe un producto con ese código', 'err');
                    return;
                }
            }

            productos.push({
                codigo: codigo,
                nombre: nombre,
                descripcion: descripcion,
                residencial: precioRes,
                comercial: precioCom,
                stock: stock,
                stockCritico: stockCritico,
                categoria: categoria
            });
            guardar(CLAVE_PRODUCTOS, productos);
            form.reset();
            toast('Producto guardado correctamente en el inventario', 'ok');
            iniciarAdminInventario();
        });
    }

    function iniciarAdminInventario() {
        var cuerpo = document.getElementById('cuerpo-inventario');
        if (!cuerpo) {
            return;
        }
        var disponibles = productosCompletos();
        var creados = leer(CLAVE_PRODUCTOS);
        var filas = [];
        var i;
        for (i = 0; i < disponibles.length; i += 1) {
            filas.push({
                id: disponibles[i].id,
                codigo: disponibles[i].codigo,
                nombre: disponibles[i].nombre,
                descripcion: disponibles[i].descripcion,
                categoria: disponibles[i].categoria,
                stock: disponibles[i].stock,
                stockCritico: disponibles[i].stockCritico,
                residencial: disponibles[i].residencial,
                comercial: disponibles[i].comercial,
                base: true
            });
        }
        for (i = 0; i < creados.length; i += 1) {
            filas.push({
                id: '',
                codigo: creados[i].codigo,
                nombre: creados[i].nombre,
                descripcion: creados[i].descripcion,
                categoria: creados[i].categoria,
                stock: creados[i].stock,
                stockCritico: creados[i].stockCritico,
                residencial: precioResidencialProducto(creados[i]),
                comercial: precioComercialProducto(creados[i]),
                base: false
            });
        }
        cuerpo.innerHTML = '';
        for (i = 0; i < filas.length; i += 1) {
            var fila = filas[i];
            var stockBajo = fila.stock <= fila.stockCritico;
            var tr = document.createElement('tr');

            var tdCodigo = document.createElement('td');
            tdCodigo.className = 'fw-bold';
            tdCodigo.textContent = fila.codigo;

            var tdNombre = document.createElement('td');
            tdNombre.textContent = fila.nombre;

            var tdCategoria = document.createElement('td');
            tdCategoria.textContent = fila.categoria;

            var tdStock = document.createElement('td');
            tdStock.innerHTML = '<span class="badge ' + (stockBajo ? 'bg-danger' : 'bg-success') + '">' + fila.stock + '</span>';

            var tdPrecioRes = document.createElement('td');
            tdPrecioRes.textContent = formatearPrecio(fila.residencial);

            var tdPrecioCom = document.createElement('td');
            tdPrecioCom.textContent = formatearPrecio(fila.comercial);

            var tdAcciones = document.createElement('td');
            tdAcciones.className = 'text-end';

            var botonEditar = document.createElement('button');
            botonEditar.type = 'button';
            botonEditar.className = 'btn btn-sm btn-outline-primary me-1';
            botonEditar.textContent = 'Editar';
            botonEditar.addEventListener('click', (function (datos) {
                return function () {
                    abrirModalEdicion(datos, datos.base ? 'base' : 'creado');
                };
            })(fila));
            tdAcciones.appendChild(botonEditar);

            if (!fila.base) {
                var botonEliminar = document.createElement('button');
                botonEliminar.type = 'button';
                botonEliminar.className = 'btn btn-sm btn-outline-danger';
                botonEliminar.textContent = 'Eliminar';
                botonEliminar.setAttribute('data-codigo', fila.codigo);
                botonEliminar.addEventListener('click', function () {
                    eliminarProductoAdmin(this.getAttribute('data-codigo'));
                });
                tdAcciones.appendChild(botonEliminar);
            }

            tr.appendChild(tdCodigo);
            tr.appendChild(tdNombre);
            tr.appendChild(tdCategoria);
            tr.appendChild(tdStock);
            tr.appendChild(tdPrecioRes);
            tr.appendChild(tdPrecioCom);
            tr.appendChild(tdAcciones);
            cuerpo.appendChild(tr);
        }
    }

    function abrirModalEdicion(producto, tipo) {
        var modal = document.getElementById('modal-editar-producto');
        if (!modal) {
            return;
        }
        var nombre = document.getElementById('editar-id');
        if (nombre) {
            nombre.value = producto.id || '';
        }
        document.getElementById('editar-tipo').value = tipo;
        document.getElementById('editar-codigo').value = producto.codigo || '';
        document.getElementById('editar-nombre').value = producto.nombre || '';
        document.getElementById('editar-descripcion').value = producto.descripcion || '';
        document.getElementById('editar-precio-res').value = producto.residencial !== undefined ? producto.residencial : 0;
        document.getElementById('editar-precio-com').value = producto.comercial !== undefined ? producto.comercial : 0;
        document.getElementById('editar-stock').value = producto.stock !== undefined ? producto.stock : 0;
        document.getElementById('editar-stock-critico').value = producto.stockCritico !== undefined ? producto.stockCritico : 0;
        document.getElementById('editar-categoria').value = producto.categoria || '';
        if (window.bootstrap && bootstrap.Modal) {
            new bootstrap.Modal(modal).show();
        } else {
            modal.style.display = 'block';
            modal.classList.add('show');
        }
    }

    function iniciarEdicionProducto() {
        var form = document.getElementById('form-editar-producto');
        if (!form) {
            return;
        }
        form.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var tipo = document.getElementById('editar-tipo').value;
            var idBase = document.getElementById('editar-id').value;
            var codigo = document.getElementById('editar-codigo').value.trim();
            var nombre = document.getElementById('editar-nombre').value.trim();
            var descripcion = document.getElementById('editar-descripcion').value.trim();
            var precioRes = parseFloat(document.getElementById('editar-precio-res').value);
            var precioCom = parseFloat(document.getElementById('editar-precio-com').value);
            var stockTexto = document.getElementById('editar-stock').value.trim();
            var stockCriticoTexto = document.getElementById('editar-stock-critico').value.trim();
            var categoria = document.getElementById('editar-categoria').value;

            if (!nombre) {
                toast('El nombre no puede estar vacío', 'err');
                return;
            }
            if (isNaN(precioRes) || precioRes < 0 || isNaN(precioCom) || precioCom < 0) {
                toast('Ingresa precios válidos (residencial y comercial)', 'err');
                return;
            }
            if (!/^\d+$/.test(stockTexto)) {
                toast('El stock debe ser un entero mayor o igual a 0', 'err');
                return;
            }
            if (stockCriticoTexto && !/^\d+$/.test(stockCriticoTexto)) {
                toast('El stock crítico debe ser un entero', 'err');
                return;
            }

            var cambios = {
                nombre: nombre,
                descripcion: descripcion,
                residencial: Math.round(precioRes),
                comercial: Math.round(precioCom),
                stock: parseInt(stockTexto, 10),
                stockCritico: stockCriticoTexto ? parseInt(stockCriticoTexto, 10) : 0,
                categoria: categoria
            };

            if (tipo === 'base') {
                var ediciones = leer(CLAVE_EDICIONES);
                var encontrada = false;
                for (var i = 0; i < ediciones.length; i += 1) {
                    if (ediciones[i].id === idBase) {
                        ediciones[i].nombre = cambios.nombre;
                        ediciones[i].descripcion = cambios.descripcion;
                        ediciones[i].residencial = cambios.residencial;
                        ediciones[i].comercial = cambios.comercial;
                        ediciones[i].stock = cambios.stock;
                        ediciones[i].stockCritico = cambios.stockCritico;
                        ediciones[i].categoria = cambios.categoria;
                        encontrada = true;
                        break;
                    }
                }
                if (!encontrada) {
                    ediciones.push({
                        id: idBase,
                        nombre: cambios.nombre,
                        descripcion: cambios.descripcion,
                        residencial: cambios.residencial,
                        comercial: cambios.comercial,
                        stock: cambios.stock,
                        stockCritico: cambios.stockCritico,
                        categoria: cambios.categoria
                    });
                }
                guardar(CLAVE_EDICIONES, ediciones);
            } else {
                var productos = leer(CLAVE_PRODUCTOS);
                for (var j = 0; j < productos.length; j += 1) {
                    if (productos[j].codigo.toLowerCase() === codigo.toLowerCase()) {
                        productos[j].nombre = cambios.nombre;
                        productos[j].descripcion = cambios.descripcion;
                        productos[j].residencial = cambios.residencial;
                        productos[j].comercial = cambios.comercial;
                        productos[j].stock = cambios.stock;
                        productos[j].stockCritico = cambios.stockCritico;
                        productos[j].categoria = cambios.categoria;
                        break;
                    }
                }
                guardar(CLAVE_PRODUCTOS, productos);
            }

            toast('Producto actualizado correctamente', 'ok');
            var modal = document.getElementById('modal-editar-producto');
            if (window.bootstrap && bootstrap.Modal && modal) {
                var instancia = bootstrap.Modal.getInstance(modal);
                if (instancia) {
                    instancia.hide();
                }
            }
            iniciarAdminInventario();
        });
    }

    function eliminarProductoAdmin(codigo) {
        var productos = leer(CLAVE_PRODUCTOS).filter(function (p) {
            return p.codigo.toLowerCase() !== codigo.toLowerCase();
        });
        guardar(CLAVE_PRODUCTOS, productos);
        toast('Producto eliminado del inventario', 'ok');
        iniciarAdminInventario();
    }

    function iniciarAdminNuevoUsuario() {
        var form = document.getElementById('form-nuevo-usuario');
        if (!form) {
            return;
        }
        form.addEventListener('submit', function (evt) {
            evt.preventDefault();
            var nombre = document.getElementById('nombre').value.trim();
            var correo = document.getElementById('correo').value.trim();
            var run = document.getElementById('run').value.trim();
            var contrasena = document.getElementById('contrasena').value;
            var confirmar = document.getElementById('confirmar-contrasena').value;
            var telefono = document.getElementById('telefono').value.trim();
            var region = document.getElementById('region').value;
            var comuna = document.getElementById('comuna').value;
            var rol = document.getElementById('rol').value;

            if (!nombre) {
                toast('Ingresa el nombre completo', 'err');
                return;
            }
            if (!correoDominioPermitido(correo)) {
                toast('El correo debe ser @duoc.cl, @profesor.duoc.cl o @gmail.com', 'err');
                return;
            }
            if (!validarRun(run)) {
                toast('El RUN debe tener entre 7 y 9 dígitos, sin puntos y sin guion', 'err');
                return;
            }
            if (String(contrasena).length < 4 || String(contrasena).length > 10) {
                toast('La contraseña debe tener entre 4 y 10 caracteres', 'err');
                return;
            }
            if (contrasena !== confirmar) {
                toast('Las contraseñas no coinciden', 'err');
                return;
            }
            if (telefono && !validarTelefono(telefono)) {
                toast('Ingresa un teléfono válido', 'err');
                return;
            }
            if (!region) {
                toast('Selecciona la región', 'err');
                return;
            }
            if (!comuna) {
                toast('Selecciona la comuna', 'err');
                return;
            }
            if (!rol) {
                toast('Selecciona el rol del usuario', 'err');
                return;
            }

            var usuarios = obtenerUsuarios();
            for (var i = 0; i < usuarios.length; i += 1) {
                if (usuarios[i].correo.toLowerCase() === correo.toLowerCase()) {
                    toast('Ese correo ya está registrado', 'err');
                    return;
                }
            }

            usuarios.push({
                fecha: hoyISO(),
                run: run,
                nombre: nombre,
                correo: correo,
                telefono: telefono,
                region: region,
                comuna: comuna,
                contrasena: contrasena,
                rol: rol,
                estado: 'Activo'
            });
            guardar(CLAVE_USUARIOS, usuarios);
            form.reset();
            toast('Administrador registrado correctamente', 'ok');
        });
    }

    function renderizarUsuarios(filtro) {
        var tbody = document.querySelector('#tabla-usuarios tbody');
        if (!tbody) {
            return;
        }
        var usuarios = obtenerUsuarios();
        var filtrados = usuarios;
        if (filtro === 'Administradores') {
            filtrados = usuarios.filter(function (u) {
                return u.rol === 'Administrador';
            });
        } else if (filtro === 'Clientes') {
            filtrados = usuarios.filter(function (u) {
                return u.rol === 'Cliente';
            });
        } else if (filtro === 'Vendedores') {
            filtrados = usuarios.filter(function (u) {
                return u.rol === 'Vendedor';
            });
        }

        if (filtrados.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-4 text-secondary">' +
                'No hay usuarios para mostrar.</td></tr>';
            return;
        }

        var html = '';
        for (var i = 0; i < filtrados.length; i += 1) {
            var u = filtrados[i];
            html += '<tr>' +
                '<td class="py-3">' + (u.fecha || '-') + '</td>' +
                '<td class="py-3">' + (u.run || '-') + '</td>' +
                '<td class="py-3">' + (u.nombre || '-') + '</td>' +
                '<td class="py-3">' + (u.rol || 'Cliente') + '</td>' +
                '<td class="py-3">' + (u.estado || 'Activo') + '</td></tr>';
        }
        tbody.innerHTML = html;
    }

    function iniciarListaUsuarios() {
        if (!document.getElementById('tabla-usuarios')) {
            return;
        }
        var filtro = document.getElementById('filtro-usuarios');
        if (filtro) {
            filtro.addEventListener('change', function () {
                renderizarUsuarios(filtro.value);
            });
        }
        renderizarUsuarios(filtro ? filtro.value : 'Todos los usuarios');
    }

    function renderizarResumenPago() {
        var contenedor = document.getElementById('lista-resumen-pago');
        if (!contenedor) {
            return;
        }
        var carrito = obtenerCarrito();
        var vacio = document.getElementById('pago-vacio');
        var contenido = document.getElementById('contenido-pago');

        if (carrito.length === 0) {
            if (vacio) {
                vacio.classList.remove('d-none');
            }
            if (contenido) {
                contenido.classList.add('d-none');
            }
            return;
        }

        var tipo = tipoSesion();

        var html = '';
        for (var i = 0; i < carrito.length; i += 1) {
            var p = obtenerProducto(carrito[i].id);
            if (!p) {
                continue;
            }
            var cantidad = Number(carrito[i].cantidad) || 0;
            html += '<div class="row border-bottom py-2 align-items-center">' +
                '<div class="col-7 col-md-6">' +
                '<div class="d-flex align-items-center gap-2">' +
                '<button type="button" class="btn btn-sm btn-outline-dark rounded-0 px-2" data-pago-accion="quitar" data-id="' + p.id + '">' + '\u2212' + '</button>' +
                '<span class="fw-bold">' + cantidad + '</span>' +
                '<button type="button" class="btn btn-sm btn-outline-dark rounded-0 px-2" data-pago-accion="agregar" data-id="' + p.id + '">+</button>' +
                '<span class="texto-2 small ms-1 text-start">' + p.nombre + '</span>' +
                '</div></div>' +
                '<div class="col-5 col-md-6 text-end texto-2">' + formatearPrecio(precioSegunTipo(p, tipo) * cantidad) + '</div></div>';
        }
        contenedor.innerHTML = html;

        var total = document.getElementById('total-pago');
        if (total) {
            total.textContent = formatearPrecio(totalCarrito(tipo));
        }
        var nota = document.getElementById('nota-precio-pago');
        if (nota) {
            nota.textContent = tipo === 'comercial'
                ? 'Precios a tarifa comercial aplicados.'
                : 'Precios a tarifa residencial aplicados.';
        }
    }

    function iniciarVentas() {
        if (!document.getElementById('contenido-pago')) {
            return;
        }

        var usuario = obtenerSesion();
        if (!usuario) {
            localStorage.setItem('pendiente', 'ventas');
            window.location.href = 'login.html';
            return;
        }

        var nombreCliente = document.getElementById('cliente-nombre');
        if (nombreCliente) {
            nombreCliente.textContent = usuario.nombre || '-';
        }
        var correoCliente = document.getElementById('cliente-correo');
        if (correoCliente) {
            correoCliente.textContent = usuario.correo || '-';
        }
        var tipoCliente = document.getElementById('cliente-tipo');
        if (tipoCliente) {
            tipoCliente.textContent = usuario.tipoCliente === 'comercial' ? 'Comercial' : 'Residencial';
        }

        var direccionInput = document.getElementById('direccion-pago');
        if (direccionInput && usuario.direccion) {
            direccionInput.value = usuario.direccion;
        }
        var comunaSelect = document.getElementById('comuna-pago');
        if (comunaSelect && usuario.comuna) {
            comunaSelect.value = usuario.comuna;
        }

        var contenedor = document.getElementById('lista-resumen-pago');
        if (contenedor) {
            contenedor.addEventListener('click', function (evt) {
                var objetivo = evt.target && evt.target.closest ? evt.target.closest('[data-pago-accion]') : null;
                if (!objetivo) {
                    return;
                }
                var accion = objetivo.getAttribute('data-pago-accion');
                var id = objetivo.getAttribute('data-id');
                if (accion === 'agregar') {
                    cambiarCantidad(id, 1);
                } else if (accion === 'quitar') {
                    cambiarCantidad(id, -1);
                }
            });
        }

        var form = document.getElementById('form-pago');
        if (form) {
            form.addEventListener('submit', function (evt) {
                evt.preventDefault();
                var direccion = document.getElementById('direccion-pago').value.trim();
                var comuna = document.getElementById('comuna-pago').value;
                var metodo = document.querySelector('input[name="metodo-pago"]:checked');

                if (!direccion) {
                    toast('Ingresa tu dirección de despacho', 'err');
                    return;
                }
                if (!comuna) {
                    toast('Selecciona tu comuna', 'err');
                    return;
                }
                if (!metodo) {
                    toast('Selecciona un método de pago', 'err');
                    return;
                }

                var tipo = tipoSesion();
                var numeroOrden = 'ORD-' + String(Date.now()).slice(-6);
                var totalOrden = totalCarrito(tipo);
                var ordenes = leer(CLAVE_ORDENES);
                ordenes.push({
                    numero: numeroOrden,
                    fecha: hoyISO(),
                    cliente: {
                        nombre: usuario.nombre || '',
                        correo: usuario.correo || '',
                        telefono: usuario.telefono || '',
                        direccion: direccion,
                        comuna: comuna
                    },
                    tipo: tipo,
                    metodoPago: metodo.value,
                    items: obtenerCarrito(),
                    total: totalOrden
                });
                guardar(CLAVE_ORDENES, ordenes);
                guardarCarrito([]);

                var contenido = document.getElementById('contenido-pago');
                var confirmacion = document.getElementById('confirmacion-pago');
                contenido.classList.add('d-none');
                confirmacion.classList.remove('d-none');
                document.getElementById('numero-orden').textContent = numeroOrden;
                document.getElementById('total-orden').textContent = formatearPrecio(totalOrden);
            });
        }

        renderizarResumenPago();
    }

    function iniciarVerMas() {
        var botones = document.querySelectorAll('.ver-mas');
        for (var i = 0; i < botones.length; i += 1) {
            (function (boton) {
                boton.addEventListener('click', function () {
                    var contenido = boton.parentNode.parentNode.querySelector('.blog-expandido');
                    if (!contenido) {
                        return;
                    }
                    var expandido = contenido.style.display === 'block';
                    contenido.style.display = expandido ? 'none' : 'block';
                    boton.textContent = expandido ? 'Ver Más' : 'Ver Menos';
                });
            })(botones[i]);
        }
    }

    function iniciarHeaderSesion() {
        var usuario = obtenerSesion();
        if (!usuario) {
            return;
        }
        var enlaces = document.querySelectorAll('a.btn-login[href="login.html"]');
        for (var i = 0; i < enlaces.length; i += 1) {
            (function (enlace) {
                var texto = (enlace.textContent || '').trim();
                if (texto.toLowerCase().indexOf('acceder') !== -1) {
                    enlace.setAttribute('title', 'Cerrar sesión');
                    enlace.innerHTML = '<i class="bi bi-box-arrow-right"></i> Cerrar sesión';
                }
            })(enlaces[i]);
        }
    }

    function iniciarCierreSesion() {
        var enlaces = document.querySelectorAll('a[href="login.html"]');
        for (var i = 0; i < enlaces.length; i += 1) {
            (function (enlace) {
                var texto = (enlace.textContent || '').trim();
                if (texto.indexOf('Cerrar') !== -1) {
                    enlace.addEventListener('click', function () {
                        localStorage.removeItem(CLAVE_SESION);
                    });
                }
            })(enlaces[i]);
        }
    }

    asegurarAdminUsuario();
    cargarRegiones();
    sincronizarContador();
    iniciarListaCarrito();
    iniciarCatalogo();
    iniciarRegistro();
    iniciarLogin();
    iniciarContacto();
    iniciarAdminNuevoProducto();
    iniciarAdminNuevoUsuario();
    iniciarAdminInventario();
    iniciarEdicionProducto();
    iniciarListaUsuarios();
    iniciarVentas();
    iniciarVerMas();
    iniciarHeaderSesion();
    iniciarCierreSesion();
})();