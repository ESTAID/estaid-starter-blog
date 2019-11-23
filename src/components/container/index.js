import React from "react"
import "./index.scss"

const Container = ({ children, className }) => (
  <div className="container">
    <div className={className}>{children}</div>
  </div>
)

export default Container
