import React from "react"
import { Link } from "gatsby"
import { rhythm } from "../../utils/typography"
import "./index.scss"

const Head = ({ title, node }) => (
  <h3
    style={{
      marginBottom: rhythm(1 / 4),
    }}
  >
    <Link className="head" style={{ boxShadow: `none` }} to={node.fields.slug}>
      {title}
    </Link>
  </h3>
)
export default Head
