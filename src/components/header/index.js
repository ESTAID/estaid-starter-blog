import React from "react"
import { Link } from "gatsby"

import "./index.scss"

const Header = ({ title }) => (
  <header className="header">
    <Link className="title" to={`/`}>
      {title}
    </Link>
  </header>
)

export default Header
