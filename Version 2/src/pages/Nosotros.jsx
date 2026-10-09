import { useState } from 'react'

// Cada "blog" es una sección con texto resumido que se expande al presionar
// "Ver Más". El estado (abierto/cerrado) vive en el componente con useState.
const BLOGS = [
  {
    id: 'trayectoria',
    titulo: 'Más de 25 años llevando energía a las familias de Chillán',
    resumen:
      'Desde hace más de dos décadas somos parte de la vida de miles de hogares en Chillán y sus alrededores.',
    imagen: '/IMAGENES/persona con cilindro de gas.png',
    alt: 'Repartidor de gas llevando un cilindro a un hogar',
    parrafos: [
      'Distribuidora de Gas El Volcán nació con la misión de acercar la energía que mueve a las familias de la región y, gracias a la confianza de nuestros clientes, hemos crecido constantemente a lo largo de estos 25 años.',
      'Hoy contamos con nuestra casa matriz en Chillán y puntos de atención en Chillán Viejo, Bulnes, Quillón y San Ignacio, llevando el mejor calor a cada rincón de la provincia.',
      'Seguimos creciendo con la misma cercanía de siempre, porque el mejor calor para tu hogar también significa estar a tu lado.',
    ],
  },
  {
    id: 'seguridad',
    titulo: 'Compromiso con la seguridad y la calidad de nuestros productos',
    resumen:
      'Sabemos que un buen servicio se basa en la seguridad, por eso cuidamos cada detalle de lo que ofrecemos.',
    imagen: '/IMAGENES/kit completo.png',
    alt: 'Kit completo de accesorios para instalación de gas',
    parrafos: [
      'Ofrecemos cilindros de 5, 11, 15 y 45 kilos, además de reguladores, mangueras, sensores y kits completos de instalación, todos verificados para garantizar su correcto funcionamiento en tu hogar.',
      'Te acompañamos también en la instalación y la mantención, con consejos prácticos para que uses el gas con toda tranquilidad.',
      'Porque la confianza se gana cuidando cada detalle, seguiremos esforzándonos por entregarte un servicio seguro, cercano y de calidad.',
    ],
  },
]

function Blog({ blog }) {
  const [abierto, setAbierto] = useState(false)

  return (
    <div className="consejo-instalacion">
      <h2 className="text-center">{blog.titulo}</h2>
      <p className="text-center blog-resumen">{blog.resumen}</p>
      <div className="text-center my-4">
        <img src={blog.imagen} className="img-fluid cilindro-consejo" alt={blog.alt} />
      </div>
      <div className="text-center">
        <button type="button" className="btn btn-login ver-mas" onClick={() => setAbierto(!abierto)}>
          {abierto ? 'Ver Menos' : 'Ver Más'}
        </button>
      </div>
      {abierto && (
        <div className="blog-expandido d-block">
          {blog.parrafos.map((parrafo, i) => (
            <p key={i}>{parrafo}</p>
          ))}
        </div>
      )}
    </div>
  )
}

function Nosotros() {
  return (
    <main className="fondo">
      <section className="container py-5">
        <div className="titulo-tiendas text-center">
          <h1>Nuestra historia y nuestro compromiso</h1>
          <p>
            Conoce quiénes somos, cómo hemos crecido y de qué manera cuidamos la seguridad de cada familia que confía
            en nosotros.
          </p>
        </div>
      </section>

      {BLOGS.map((blog) => (
        <section className="container py-4" key={blog.id}>
          <Blog blog={blog} />
        </section>
      ))}
    </main>
  )
}

export default Nosotros
