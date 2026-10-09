import { Link } from 'react-router-dom'

const CONSEJOS_RAPIDOS = [
  {
    icono: 'bi-fire',
    titulo: 'Evita fuentes de calor',
    texto: 'Mantén el cilindro alejado de llamas, estufas y otras fuentes de calor.',
  },
  {
    icono: 'bi-wind',
    titulo: 'Mantén ventilado',
    texto: 'Utiliza el cilindro en espacios correctamente ventilados.',
  },
  {
    icono: 'bi-tools',
    titulo: 'Revisa las conexiones',
    texto: 'Comprueba periódicamente el estado de la manguera y el regulador.',
  },
]

const PASOS_FUGA = [
  'Ventila el lugar.',
  'Cierra la llave de paso si es seguro hacerlo.',
  'No enciendas llamas ni interruptores.',
]

function Consejos() {
  return (
    <main className="fondo">
      <section className="container py-5">
        <div className="titulo-consejos text-center">
          <h1>Consejos para un uso seguro del gas</h1>
          <p>Aprende algunas recomendaciones para utilizar, instalar y mantener correctamente tu cilindro de gas.</p>
        </div>
      </section>

      <section className="container py-5 estilo-texto">
        <div className="consejo-instalacion">
          <div className="row align-items-center">
            <div className="col-12 col-md-5 text-center">
              <img
                src="/IMAGENES/cilindro de 11K.png"
                className="img-fluid cilindro-consejo"
                alt="Cilindro de gas de 11 kilos"
              />
            </div>
            <div className="col-12 col-md-7">
              <h2>¿Cómo instalar correctamente un cilindro?</h2>
              <p>Para utilizar un cilindro de gas de forma segura, es importante seguir algunas recomendaciones.</p>
              <ol>
                <li>Mantén el cilindro siempre en posición vertical.</li>
                <li>Ubícalo en un lugar ventilado.</li>
                <li>Utiliza un regulador adecuado para el cilindro.</li>
                <li>Revisa que las conexiones estén correctamente instaladas.</li>
                <li>Mantén el cilindro alejado de fuentes de calor.</li>
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5 estilo-texto">
        <h2 className="text-center mb-4">Consejos importantes</h2>
        <div className="row g-4">
          {CONSEJOS_RAPIDOS.map((c) => (
            <div className="col-12 col-md-4" key={c.titulo}>
              <div className="card text-center h-100">
                <div className="card-body">
                  <i className={`bi ${c.icono} fs-1`} />
                  <h4 className="card-title mt-3">{c.titulo}</h4>
                  <p className="card-text estilo-texto">{c.texto}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container py-5 estilo-texto">
        <h2 className="text-center mb-4">¿Cómo instalar tu regulador o válvula de gas en el cilindro de gas?</h2>
        <div className="row justify-content-center">
          <div className="col-12 col-lg-8">
            <div className="ratio ratio-16x9">
              <iframe
                src="https://www.youtube.com/embed/0fCfwMzaDOI"
                title="explicacion de como instalar tu regulador o válvula de gas"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5 estilo-texto">
        <div className="card">
          <div className="card-body text-center">
            <i className="bi bi-exclamation-triangle-fill fs-1" />
            <h2 className="mt-3 estilo-texto">¿Qué hacer ante una posible fuga?</h2>
            <p className="estilo-texto">
              Si percibes olor a gas, actúa con precaución y evita cualquier fuente de ignición.
            </p>
            <div className="row mt-4 estilo-texto">
              {PASOS_FUGA.map((paso, i) => (
                <div className="col-12 col-md-4" key={paso}>
                  <strong>{i + 1}.</strong>
                  <p>{paso}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="container py-5">
        <div className="cta-consejos text-center">
          <h2>¿Necesitas gas o accesorios?</h2>
          <p>Revisa nuestros productos disponibles y encuentra lo que necesitas para tu hogar.</p>
          <Link to="/productos" className="btn btn-login">
            Ver catálogo
          </Link>
        </div>
      </section>
    </main>
  )
}

export default Consejos
