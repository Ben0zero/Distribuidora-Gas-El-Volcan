function Footer() {
  return (
    <footer>
      <div className="container py-3">
        <div className="row align-items-center text-center">
          <div className="col">
            <img src="/IMAGENES/Logo Gas.png" style={{ width: 90 }} alt="Logo Corporativo" />
          </div>
          <div className="col">
            <h5 className="texto-2">Contacto</h5>
            <p className="texto-2">+56 42 234 5678 · pedidos@elvolcangas.cl</p>
          </div>
          <div className="col">
            <figcaption className="blockquote-footer texto-2">
              © 2026 Distribuidora de Gas El Volcán. Proyecto académico DSY1104.
            </figcaption>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
