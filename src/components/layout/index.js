import React from "react"

import Header from "../header"
import Container from "../container"
import Footer from "../footer"
import { rhythm } from "../../utils/typography"
import "./index.scss"

class Layout extends React.Component {
  render() {
    const { title, children } = this.props

    return (
      <div className="layout">
        <Header title={title} />
        <Container className="main">
          <main>{children}</main>
          <hr
            style={{
              marginBottom: rhythm(1),
            }}
          />
          <Footer />
        </Container>
      </div>
    )
  }
}

export default Layout
