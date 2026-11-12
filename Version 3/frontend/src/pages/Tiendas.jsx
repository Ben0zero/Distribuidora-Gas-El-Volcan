import { Row, Col } from 'react-bootstrap'

const SUCURSALES = [
  {
    nombre: 'Casa Matriz - Chillán',
    etiqueta: 'Punto principal',
    tipo: 'badge-matriz',
    icono: 'bi-building',
    direccion: "Av. O'Higgins 1250, Chillán",
    telefono: '+56 42 234 5678',
    horario: 'Lunes a viernes: 09:00 - 18:00 hrs.',
  },
  {
    nombre: 'Chillán Viejo',
    etiqueta: 'Próximamente',
    tipo: 'badge-futura',
    icono: 'bi-shop',
    direccion: "Av. O'Higgins 850, Chillán Viejo",
    telefono: '+56 42 124 1991',
  },
  {
    nombre: 'Bulnes',
    etiqueta: 'Próximamente',
    tipo: 'badge-futura',
    icono: 'bi-shop',
    direccion: 'Av. Eleuterio Ramírez 450, Bulnes',
    telefono: '+56 42 178 3632',
  },
  {
    nombre: 'Quillón',
    etiqueta: 'Única sucursal',
    tipo: 'badge-futura',
    icono: 'bi-shop',
    direccion: 'Av. Cayumanqui 620, Quillón',
    telefono: '+56 42 579 1795',
  },
  {
    nombre: 'San Ignacio',
    etiqueta: 'Sucursal afiliada',
    tipo: 'badge-futura',
    icono: 'bi-shop',
    direccion: 'Av. Los Carrera 380, San Ignacio',
    telefono: '+56 42 584 4965',
  },
]

function Tiendas() {
  return (
    <main className="tiendas fondo">
      <section className="container py-5">
        <div className="titulo-tiendas text-center">
          <h1>¿Dónde encontrar nuestras tiendas?</h1>
          <p>Encuentra nuestros futuros puntos de atención y distribución en Chillán y sus alrededores.</p>
          <p className="texto-referencial">
            <i className="bi bi-info-circle-fill" /> Recuerda confirmar por teléfono antes de ir, y siempre tendremos
            promociones que te sorprenderán.
          </p>
        </div>
      </section>

      <section className="container pb-5">
        <Row className="g-4">
          <Col xs={12} lg={5}>
            <div className="lista-tiendas">
              <h2>
                <i className="bi bi-shop" /> Nuestros puntos de atención
              </h2>

              {SUCURSALES.map((s) => (
                <div className="tienda-card" key={s.nombre}>
                  <h4>
                    <i className={`bi ${s.icono}`} /> {s.nombre}
                  </h4>
                  <span className={`badge ${s.tipo}`}>{s.etiqueta}</span>
                  <p>
                    <i className="bi bi-geo-alt-fill" /> {s.direccion}
                  </p>
                  <p>
                    <i className="bi bi-telephone-fill" /> {s.telefono}
                  </p>
                  {s.horario && (
                    <p>
                      <i className="bi bi-clock-fill" /> {s.horario}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Col>

          <Col xs={12} lg={7}>
            <div className="mapa-contenedor">
              <h2>
                <i className="bi bi-map-fill" /> Ubicación de nuestros puntos
              </h2>
              <p>Consulta la ubicación general de nuestros puntos de atención en Chillán y sus alrededores.</p>

              <div className="mapa-tiendas">
                <iframe
                  src="https://www.google.com/maps?q=Av.+O'Higgins+1250,+Chillán,+Chile&output=embed"
                  title="Mapa de sucursales El Volcán"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>

              <div className="leyenda-mapa">
                <span>
                  <i className="bi bi-geo-alt-fill" /> Punto de atención
                </span>
                <span>
                  <i className="bi bi-info-circle-fill" /> Ubicación referencial
                </span>
              </div>
            </div>
          </Col>
        </Row>
      </section>

      <section className="container pb-5">
        <div className="info-futuras text-center">
          <i className="bi bi-building-add" />
          <h2>Seguimos creciendo</h2>
          <p>
            Las futuras sucursales permitirán ampliar nuestra cobertura y acercar nuestros productos y servicios a más
            familias de la región.
          </p>
        </div>
      </section>
    </main>
  )
}

export default Tiendas
