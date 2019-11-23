import React from "react"
import { Github, Instagram } from "../social"
import "./index.scss"

const Footer = () => (
  <footer className="footer">
    <div className="footer-wrapper">
      <div className="footer-author">
        {`\u00A9 built in estaid-starter-blog ${new Date().getFullYear()}`}
      </div>
      <div>
        <Github />
        <Instagram />
      </div>
    </div>
  </footer>
)

export default Footer
